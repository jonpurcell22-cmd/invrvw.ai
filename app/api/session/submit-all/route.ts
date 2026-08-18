import { NextResponse } from "next/server";
import { scoreAnswerWithClaude } from "@/lib/claude-score-response";
import { generateSessionSummary } from "@/lib/claude-session-summary";
import { ensureUser } from "@/lib/ensure-user";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 300;

type AnswerPayload = {
  questionId: string;
  transcript: string;
  speechMeta?: {
    durationSec?: number | null;
    wordCount?: number | null;
    wordsPerMinute?: number | null;
    fillerCount?: number | null;
    fillersPerMinute?: number | null;
    fillerBreakdown?: { word: string; count: number }[] | null;
  } | null;
};

/**
 * POST /api/session/submit-all
 *
 * Submits all answers for a session at once and scores them in parallel.
 * This replaces the per-question scoring flow for a faster, interview-like experience.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed } = rateLimit(ip, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const user = await ensureUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId?: string;
      answers?: AnswerPayload[];
    };

    const sessionId = body.sessionId?.trim();
    const answers = body.answers;

    if (!sessionId || !answers?.length) {
      return NextResponse.json(
        { error: "sessionId and answers are required" },
        { status: 400 },
      );
    }

    // Fetch session with all context needed for scoring
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select(
        "id, user_id, company_name, role_title, seniority_level, interview_stage, resume_text, job_description_text, company_research",
      )
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session || session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    // Fetch all questions for this session
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, question_text, question_category, rubric")
      .eq("session_id", sessionId);

    if (qErr || !questions?.length) {
      return NextResponse.json(
        { error: "No questions found" },
        { status: 404 },
      );
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Validate all answers reference valid questions
    for (const a of answers) {
      if (!questionMap.has(a.questionId)) {
        return NextResponse.json(
          { error: `Invalid questionId: ${a.questionId}` },
          { status: 400 },
        );
      }
      if (!a.transcript?.trim()) {
        return NextResponse.json(
          { error: "All answers must have a transcript" },
          { status: 400 },
        );
      }
    }

    // Delete any existing responses for this session
    await supabase.from("responses").delete().eq("session_id", sessionId);

    // Score ALL answers in parallel
    const scoringPromises = answers.map(async (a) => {
      const question = questionMap.get(a.questionId)!;
      const scored = await scoreAnswerWithClaude({
        questionText: question.question_text,
        questionCategory: question.question_category,
        rubric: question.rubric,
        companyName: session.company_name,
        roleTitle: session.role_title,
        seniorityLevel: session.seniority_level,
        interviewStage: session.interview_stage,
        resumeText: session.resume_text,
        jobDescriptionText: session.job_description_text,
        companyResearch: session.company_research,
        transcript: a.transcript.trim(),
        speechMeta: a.speechMeta ?? null,
      });

      return {
        question_id: a.questionId,
        session_id: sessionId,
        transcript: a.transcript.trim(),
        score: scored.overallScore100,
        feedback: JSON.stringify({
          dimensions: scored.dimensions,
          overallScore1To5: scored.overallScore1To5,
          deliveryFeedback: scored.deliveryFeedback,
        }),
        model_answer: scored.modelAnswer,
        audio_url: null,
      };
    });

    const scoredResponses = await Promise.all(scoringPromises);

    // Insert all responses
    const { error: insertErr } = await supabase
      .from("responses")
      .insert(scoredResponses);

    if (insertErr) {
      console.error(insertErr);
      return NextResponse.json(
        { error: "Failed to save responses" },
        { status: 500 },
      );
    }

    // Calculate overall score
    const avg =
      scoredResponses.reduce((acc, r) => acc + r.score, 0) /
      scoredResponses.length;
    const overallScore = Math.round(avg);

    // Generate session summary in parallel with saving
    let summary: string | null = null;
    try {
      summary = await generateSessionSummary({
        companyName: session.company_name,
        roleTitle: session.role_title,
        seniorityLevel: session.seniority_level,
        interviewStage: session.interview_stage,
        overallScore,
        questions: answers.map((a) => {
          const q = questionMap.get(a.questionId)!;
          const resp = scoredResponses.find(
            (r) => r.question_id === a.questionId,
          );
          return {
            questionText: q.question_text,
            category: q.question_category,
            transcript: a.transcript.trim(),
            score: resp?.score ?? 0,
            feedback: resp?.feedback ?? null,
          };
        }),
      });
    } catch (e) {
      console.error("Summary generation failed:", e);
    }

    // Update session as completed
    await supabase
      .from("sessions")
      .update({
        overall_score: overallScore,
        status: "completed",
        ...(summary ? { summary } : {}),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      overallScore,
      resultsUrl: `/session/${sessionId}/results`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scoring failed";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
