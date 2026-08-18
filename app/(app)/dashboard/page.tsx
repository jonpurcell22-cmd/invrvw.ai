import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Session } from "@/types";
import { RetrySessionButton } from "@/components/RetrySessionButton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  // Score trend — completed sessions in chronological order
  const completedScores = rows
    .filter((s) => s.status === "completed" && s.overall_score != null)
    .reverse()
    .map((s) => s.overall_score as number);

  const hasScores = completedScores.length >= 1;
  const avgScore = hasScores
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
    : null;
  const trend =
    completedScores.length >= 2
      ? completedScores[completedScores.length - 1] - completedScores[completedScores.length - 2]
      : null;

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
        <div className="flex gap-3">
          {completedScores.length >= 2 ? (
            <Button variant="secondary" href="/dashboard/progress">
              View progress
            </Button>
          ) : null}
          <Button variant="primary" href="/session/new">
            New session
          </Button>
        </div>
      </div>

      {/* Score trend bar */}
      {hasScores ? (
        <section className="mt-8 animate-fade-up rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Avg score */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--fg-subtle)]">
                  Average score
                </p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-[var(--fg)]">
                  {avgScore}
                  <span className="text-sm font-normal text-[var(--fg-subtle)]">
                    /100
                  </span>
                </p>
              </div>
              {trend !== null ? (
                <div
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                    trend > 0
                      ? "bg-[var(--success-muted)] text-[var(--success)]"
                      : trend < 0
                        ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                        : "bg-[var(--surface-raised)] text-[var(--fg-subtle)]"
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp size={12} />
                  ) : trend < 0 ? (
                    <TrendingDown size={12} />
                  ) : (
                    <Minus size={12} />
                  )}
                  {trend > 0 ? "+" : ""}
                  {trend} pts
                </div>
              ) : null}
            </div>

            {/* Score sparkline */}
            {completedScores.length >= 2 ? (
              <div className="flex items-end gap-1 h-10">
                {completedScores.map((score, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-sm bg-[var(--accent)] transition-all"
                    style={{
                      height: `${Math.max(8, (score / 100) * 40)}px`,
                      opacity: i === completedScores.length - 1 ? 1 : 0.4,
                    }}
                    title={`Session ${i + 1}: ${score}/100`}
                  />
                ))}
              </div>
            ) : null}

            <div className="text-xs text-[var(--fg-subtle)]">
              {completedScores.length} completed session{completedScores.length !== 1 ? "s" : ""}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="sr-only">Your sessions</h2>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
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
                    className="group relative block cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
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
                      <div className="flex items-center gap-2">
                        {s.status === "completed" ? (
                          <RetrySessionButton sessionId={s.id} />
                        ) : null}
                        {s.overall_score != null ? (
                          <span className="font-mono font-medium text-[var(--accent)]">
                            {s.overall_score}/100
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
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
