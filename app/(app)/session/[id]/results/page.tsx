import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ResultsGate } from "@/components/ResultsGate";
import { ResultsView, type ResultRow } from "@/components/ResultsView";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function SessionResultsPage({
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
    redirect(`/login?next=${encodeURIComponent(`/session/${id}/results`)}`);
  }

  // Check if user is anonymous — show signup gate
  if (user.is_anonymous) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <ResultsGate sessionId={id} />
      </main>
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, user_id, overall_score, summary")
    .eq("id", id)
    .single();

  if (sessionError || !session || session.user_id !== user.id) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, question_category, question_order")
    .eq("session_id", id)
    .order("question_order", { ascending: true });

  const { data: responses } = await supabase
    .from("responses")
    .select("question_id, score, feedback, model_answer, transcript")
    .eq("session_id", id);

  if (!questions?.length) {
    redirect("/dashboard");
  }

  const missing = questions.some(
    (q) => !responses?.some((r) => r.question_id === q.id),
  );
  if (missing) {
    redirect(`/session/${id}/questions`);
  }

  const scores = (responses ?? [])
    .map((r) => r.score)
    .filter((s): s is number => s != null);
  const computedOverall = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const overall = session.overall_score ?? computedOverall;

  if (session.overall_score == null && scores.length === questions.length) {
    await supabase
      .from("sessions")
      .update({ overall_score: computedOverall, status: "completed" })
      .eq("id", id);
  }

  const rows: ResultRow[] = questions.map((q) => {
    const r = responses?.find((x) => x.question_id === q.id);
    return {
      questionId: q.id,
      questionText: q.question_text,
      category: q.question_category,
      score: r?.score ?? 0,
      transcript: r?.transcript ?? null,
      feedbackRaw: r?.feedback ?? null,
      modelAnswer: r?.model_answer ?? null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
      >
        ← Dashboard
      </Link>

      <ResultsView
        sessionId={id}
        overallScore={overall}
        rows={rows}
        summaryRaw={session.summary ?? null}
      />
    </main>
  );
}
