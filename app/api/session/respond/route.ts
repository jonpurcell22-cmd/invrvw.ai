import { NextResponse } from "next/server";
import { scoreAnswerWithClaude } from "@/lib/claude-score-response";
import { generateSessionSummary } from "@/lib/claude-session-summary";
import { ensureUser } from "@/lib/ensure-user";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Rate limit: 30 answer submissions per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = rateLimit(ip, { limit: 30, windowMs: 60 * 60 * 1000 });
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
      questionId?: string;
      transcript?: string;
      speechMeta?: {
        durationSec?: number | null;
        wordCount?: number | null;
        wordsPerMinute?: number | null;
      };
    };

    const sessionId = body.sessionId?.trim();
    const questionId = body.questionId?.trim();
    const transcript = body.transcript?.trim();

    if (!sessionId || !questionId || !transcript) {
      return NextResponse.json(
        { error: "sessionId, questionId, and transcript are required" },
        { status: 400 },
      );
    }

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select(
        "id, user_id, company_name, role_title, seniority_level, interview_stage, resume_text, job_description_text, company_research",
      )
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: question, error: qErr } = await supabase
      .from("questions")
      .select("id, session_id, question_text, question_category, rubric")
      .eq("id", questionId)
      .eq("session_id", sessionId)
      .single();

    if (qErr || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

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
      transcript,
      speechMeta: body.speechMeta ?? null,
    });

    const feedbackPayload = JSON.stringify({
      dimensions: scored.dimensions,
      overallScore1To5: scored.overallScore1To5,
    });

    await supabase
      .from("responses")
      .delete()
      .eq("session_id", sessionId)
      .eq("question_id", questionId);

    const { error: insertErr } = await supabase.from("responses").insert({
      question_id: questionId,
      session_id: sessionId,
      transcript,
      score: scored.overallScore100,
      feedback: feedbackPayload,
      model_answer: scored.modelAnswer,
      audio_url: null,
    });

    if (insertErr) {
      console.error(insertErr);
      return NextResponse.json(
        { error: insertErr.message ?? "Failed to save response" },
        { status: 500 },
      );
    }

    const { count: qCount, error: qcErr } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    const { count: rCount, error: rcErr } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (!qcErr && !rcErr && qCount != null && rCount != null && qCount > 0) {
      if (rCount >= qCount) {
        const { data: allResponses } = await supabase
          .from("responses")
          .select("score, transcript, feedback, question_id")
          .eq("session_id", sessionId);

        const { data: allQuestions } = await supabase
          .from("questions")
          .select("id, question_text, question_category")
          .eq("session_id", sessionId);

        if (allResponses?.length) {
          const avg =
            allResponses.reduce((acc, r) => acc + (r.score ?? 0), 0) /
            allResponses.length;
          const overallScore = Math.round(avg);

          // Generate session summary
          let summary: string | null = null;
          try {
            const summaryQuestions = (allQuestions ?? []).map((q) => {
              const r = allResponses.find((x) => x.question_id === q.id);
              return {
                questionText: q.question_text,
                category: q.question_category,
                transcript: r?.transcript ?? "",
                score: r?.score ?? 0,
                feedback: r?.feedback ?? null,
              };
            });

            summary = await generateSessionSummary({
              companyName: session.company_name,
              roleTitle: session.role_title,
              seniorityLevel: session.seniority_level,
              interviewStage: session.interview_stage,
              overallScore,
              questions: summaryQuestions,
            });
          } catch (e) {
            console.error("Summary generation failed:", e);
          }

          await supabase
            .from("sessions")
            .update({
              overall_score: overallScore,
              status: "completed",
              ...(summary ? { summary } : {}),
            })
            .eq("id", sessionId);
        }
      }
    }

    return NextResponse.json({
      score: scored.overallScore100,
      score1To5: scored.overallScore1To5,
      feedback: feedbackPayload,
      modelAnswer: scored.modelAnswer,
      dimensions: scored.dimensions,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scoring failed";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
