import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionQuestionPractice } from "@/components/SessionQuestionPractice";
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

  if (!user) {
    redirect(`/session/new`);
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (sessionError || !session || session.user_id !== user.id) {
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
      />
    </main>
  );
}
