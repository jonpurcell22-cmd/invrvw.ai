import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Session } from "@/types";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

const statusTone: Record<string, "neutral" | "success" | "warning" | "info" | "muted"> = {
  draft: "muted",
  in_progress: "info",
  generating_questions: "warning",
  awaiting_answers: "info",
  scoring: "warning",
  completed: "success",
  archived: "neutral",
};

function scoreColor(score: number): string {
  if (score >= 75) return "text-[var(--success)]";
  if (score >= 50) return "text-[var(--info)]";
  if (score >= 25) return "text-[var(--warning)]";
  return "text-[var(--danger)]";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, created_at, company_name, role_title, interview_stage, status, overall_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (sessions ?? []) as {
    id: string;
    created_at: string;
    company_name: string | null;
    role_title: string | null;
    interview_stage: string | null;
    status: Session["status"];
    overall_score: number | null;
  }[];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
            Sessions
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
            {rows.length > 0
              ? "Your interview practice sessions. Click any session to review results or continue practicing."
              : "No sessions yet. Start your first practice session to get personalized interview coaching."}
          </p>
        </div>
        <Button variant="primary" href="/session/new">
          New session
        </Button>
      </div>

      <section className="mt-12">
        <h2 className="sr-only">Your sessions</h2>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center glass gradient-border rounded-2xl px-6 py-16 text-center">
            <p className="text-sm text-[var(--fg-muted)]">
              Upload a resume and job description to generate your first set of
              tailored interview questions.
            </p>
            <Button variant="primary" size="lg" href="/session/new" className="mt-6">
              Start your first session
            </Button>
          </div>
        ) : (
          <ul className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((s) => {
              const date = new Date(s.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const href =
                s.status === "completed"
                  ? `/session/${s.id}/results`
                  : `/session/${s.id}/questions`;

              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    className="group relative block glass gradient-border rounded-2xl p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--fg)]">
                          {s.role_title ?? "Untitled role"}
                        </p>
                        <p className="mt-1 truncate text-sm text-[var(--fg-muted)]">
                          {s.company_name ?? "Company TBD"}
                        </p>
                      </div>
                      <Badge tone={statusTone[s.status] ?? "neutral"}>
                        {formatStatus(s.status)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--fg-subtle)]">
                      <span>{date}</span>
                      {s.overall_score != null ? (
                        <span className={`font-mono font-medium text-gradient`}>
                          {s.overall_score}/100
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
