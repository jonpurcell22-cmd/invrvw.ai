import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionFeedbackForm } from "@/components/SessionFeedbackForm";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function SessionFeedbackPage({
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
    redirect(`/login?next=${encodeURIComponent(`/session/${id}/feedback`)}`);
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, user_id, status, role_title, company_name")
    .eq("id", id)
    .single();

  if (error || !session || session.user_id !== user.id) {
    notFound();
  }
  if (session.status !== "completed") {
    redirect(`/session/${id}/questions`);
  }

  const { data: existing } = await supabase
    .from("session_feedback")
    .select("stuck, useful, change")
    .eq("session_id", id)
    .maybeSingle();

  const title = [session.role_title, session.company_name]
    .filter(Boolean)
    .join(" at ");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link
        href={`/session/${id}/results`}
        className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
      >
        ← Results
      </Link>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg)]">
        How did this session go?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
        {title
          ? `Three short notes on your ${title} practice. `
          : "Three short notes. "}
        Answer any of them. This stays on your account and is not shown to
        your instructor.
      </p>
      <div className="mt-8">
        <SessionFeedbackForm
          sessionId={id}
          initial={{
            stuck: existing?.stuck ?? "",
            useful: existing?.useful ?? "",
            change: existing?.change ?? "",
          }}
        />
      </div>
    </main>
  );
}
