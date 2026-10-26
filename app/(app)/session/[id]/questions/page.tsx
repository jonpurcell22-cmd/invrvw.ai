import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionQuestionPractice } from "@/components/SessionQuestionPractice";
import {
  isMissingInterviewerColumn,
  unpackCompanyResearch,
} from "@/lib/interviewer-context";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function SessionQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    redirect(`/login?next=${encodeURIComponent(`/session/${id}/questions`)}`);
  }

  const withInterviewer = await supabase
    .from("sessions")
    .select("id, user_id, interviewer_name")
    .eq("id", id)
    .single();

  let ownerId: string | null = withInterviewer.data?.user_id ?? null;
  let interviewerName = withInterviewer.data?.interviewer_name?.trim() || null;

  if (
    withInterviewer.error &&
    isMissingInterviewerColumn(withInterviewer.error.message)
  ) {
    const fallback = await supabase
      .from("sessions")
      .select("id, user_id, company_research")
      .eq("id", id)
      .single();
    ownerId = fallback.data?.user_id ?? null;
    interviewerName = fallback.data
      ? unpackCompanyResearch(fallback.data.company_research).interviewer.name
      : null;
    if (fallback.error || !fallback.data) {
      notFound();
    }
  } else if (withInterviewer.error || !withInterviewer.data) {
    notFound();
  }

  if (ownerId !== user.id) {
    notFound();
  }

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("id, question_text, question_category, question_order")
    .eq("session_id", id)
    .order("question_order", { ascending: true });

  if (qError || !questions?.length) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          ← Dashboard
        </Link>
        <p className="mt-8 text-sm text-[var(--fg-muted)]">
          No questions found for this session.{" "}
          <Link href="/session/new" className="underline">
            Start a new session
          </Link>
          .
        </p>
      </main>
    );
  }

  const { data: responses } = await supabase
    .from("responses")
    .select("question_id")
    .eq("session_id", id);

  const answered = new Set((responses ?? []).map((r) => r.question_id));
  const allAnswered = questions.every((q) => answered.has(q.id));

  if (allAnswered) {
    redirect(`/session/${id}/results`);
  }

  const startIndex = questions.findIndex((q) => !answered.has(q.id));
  const safeStart = startIndex === -1 ? 0 : startIndex;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <SessionQuestionPractice
        sessionId={id}
        questions={questions}
        startIndex={safeStart}
        interviewerName={interviewerName}
      />
    </main>
  );
}
