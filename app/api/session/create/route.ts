import { NextResponse } from "next/server";
import {
  generateSessionInterviewPlan,
  type GeneratedQuestion,
} from "@/lib/claude";
import { INTERVIEW_STAGES } from "@/lib/constants";
import { parseDocumentBuffer } from "@/lib/docParser";
import { ensureUser } from "@/lib/ensure-user";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 300;

const STAGE_SET = new Set<string>([...INTERVIEW_STAGES]);

function rubricToJsonb(q: GeneratedQuestion) {
  return {
    scaleMin: q.rubric.scale_min,
    scaleMax: q.rubric.scale_max,
    notes: q.rubric.notes,
    dimensions: q.rubric.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description,
      weight: d.weight,
    })),
  };
}

export async function POST(request: Request) {
  try {
    // Rate limit: 5 session creations per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = rateLimit(ip, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many sessions created. Please try again later." },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const user = await ensureUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const resumeSource = String(formData.get("resumeSource") ?? "upload").trim();
    const resumeEntry = formData.get("resume");

    const jdFileEntry = formData.get("jobDescriptionFile");
    const jdTextRaw = String(formData.get("jobDescriptionText") ?? "").trim();

    let jobDescriptionText = jdTextRaw;
    if (jdFileEntry instanceof File && jdFileEntry.size > 0) {
      const jdBuf = Buffer.from(await jdFileEntry.arrayBuffer());
      const parsed = await parseDocumentBuffer(jdBuf, jdFileEntry.name);
      if (!parsed.text.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from job description file." },
          { status: 400 },
        );
      }
      jobDescriptionText = parsed.text.trim();
    }

    if (!jobDescriptionText) {
      return NextResponse.json(
        { error: "Provide a job description as PDF upload or pasted text" },
        { status: 400 },
      );
    }

    const interviewStage = String(formData.get("interviewStage") ?? "").trim();
    if (!interviewStage || !STAGE_SET.has(interviewStage)) {
      return NextResponse.json(
        { error: "Invalid interview stage" },
        { status: 400 },
      );
    }

    const companyHint = String(formData.get("companyHint") ?? "").trim();
    const roleHint = String(formData.get("roleHint") ?? "").trim();

    let resumeText = "";
    let resumeFilename = "";

    if (resumeSource === "saved") {
      // Use saved resume from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_text, resume_filename")
        .eq("id", user.id)
        .single();

      if (!profile?.resume_text) {
        return NextResponse.json(
          { error: "No saved resume found. Please upload one." },
          { status: 400 },
        );
      }
      resumeText = profile.resume_text;
      resumeFilename = profile.resume_filename ?? "saved-resume.pdf";
    } else {
      // Upload new resume
      if (!(resumeEntry instanceof File) || resumeEntry.size === 0) {
        return NextResponse.json(
          { error: "Resume PDF is required" },
          { status: 400 },
        );
      }
      const resumeBuf = Buffer.from(await resumeEntry.arrayBuffer());
      const resumeParsed = await parseDocumentBuffer(resumeBuf, resumeEntry.name);
      if (!resumeParsed.text.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from resume. Try a PDF or DOCX file." },
          { status: 400 },
        );
      }
      resumeText = resumeParsed.text.trim();
      resumeFilename = resumeEntry.name;

      // Save to profile for future use
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          resume_text: resumeText,
          resume_filename: resumeFilename,
          updated_at: new Date().toISOString(),
        });
    }

    const plan = await generateSessionInterviewPlan({
      resumeText,
      jobDescriptionText,
      interviewStage,
      companyHint: companyHint || undefined,
      roleHint: roleHint || undefined,
    });

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        company_name: plan.company_name,
        role_title: plan.role_title,
        interview_stage: interviewStage,
        seniority_level: plan.seniority_level,
        resume_text: resumeText,
        job_description_text: jobDescriptionText,
        company_research: plan.company_research_summary,
        overall_score: null,
        status: "awaiting_answers",
      })
      .select("id")
      .single();

    if (sessionError || !sessionRow) {
      console.error(sessionError);
      return NextResponse.json(
        { error: sessionError?.message ?? "Failed to create session" },
        { status: 500 },
      );
    }

    const questionRows = plan.questions.map((q, i) => ({
      session_id: sessionRow.id,
      question_order: i + 1,
      question_text: q.question_text,
      question_category: q.question_category,
      rubric: rubricToJsonb(q),
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows);

    if (questionsError) {
      console.error(questionsError);
      await supabase.from("sessions").delete().eq("id", sessionRow.id);
      return NextResponse.json(
        { error: questionsError.message ?? "Failed to save questions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessionId: sessionRow.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Session creation failed";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
