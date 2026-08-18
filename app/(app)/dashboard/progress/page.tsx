import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const DIMENSION_LABELS: Record<string, string> = {
  relevance: "Relevance",
  structure: "Structure",
  specificity: "Specificity",
  impact_articulation: "Impact",
  communication_clarity: "Clarity",
  analytical_reasoning: "Reasoning",
  values_culture_signal: "Values",
};

type DimScores = Record<string, { score: number; feedback: string }>;

function parseDimensions(raw: string | null): DimScores | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { dimensions?: DimScores };
    return parsed.dimensions ?? null;
  } catch {
    return null;
  }
}

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/progress");

  // Fetch all completed sessions with their responses
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, created_at, company_name, role_title, overall_score, status")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const completedSessions = sessions ?? [];

  if (completedSessions.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg)]">
          Your progress
        </h1>
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            Complete at least one session to start tracking your progress.
          </p>
          <Button variant="primary" href="/session/new" className="mt-6">
            Start a session
          </Button>
        </div>
      </main>
    );
  }

  // Fetch all responses for completed sessions
  const sessionIds = completedSessions.map((s) => s.id);
  const { data: responses } = await supabase
    .from("responses")
    .select("session_id, score, feedback")
    .in("session_id", sessionIds);

  // Group responses by session and compute per-dimension averages
  const sessionDimAverages: {
    sessionId: string;
    date: string;
    company: string;
    role: string;
    overall: number;
    dims: Record<string, number>;
  }[] = [];

  for (const session of completedSessions) {
    const sessionResponses = (responses ?? []).filter(
      (r) => r.session_id === session.id,
    );
    if (sessionResponses.length === 0) continue;

    const dimTotals = new Map<string, { sum: number; count: number }>();
    for (const r of sessionResponses) {
      const dims = parseDimensions(r.feedback);
      if (!dims) continue;
      for (const [key, val] of Object.entries(dims)) {
        const entry = dimTotals.get(key) ?? { sum: 0, count: 0 };
        entry.sum += val.score;
        entry.count++;
        dimTotals.set(key, entry);
      }
    }

    const dimAvgs: Record<string, number> = {};
    for (const [key, val] of dimTotals) {
      dimAvgs[key] = Math.round((val.sum / val.count) * 10) / 10;
    }

    sessionDimAverages.push({
      sessionId: session.id,
      date: new Date(session.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      company: session.company_name ?? "Unknown",
      role: session.role_title ?? "Unknown",
      overall: session.overall_score ?? 0,
      dims: dimAvgs,
    });
  }

  // Compute cross-session dimension trends
  const allDimKeys = Object.keys(DIMENSION_LABELS);
  const dimTrends: {
    key: string;
    label: string;
    current: number | null;
    previous: number | null;
    change: number | null;
    allScores: number[];
  }[] = allDimKeys.map((key) => {
    const scores = sessionDimAverages
      .map((s) => s.dims[key])
      .filter((v): v is number => v != null);
    const current = scores.length > 0 ? scores[scores.length - 1] : null;
    const previous = scores.length > 1 ? scores[scores.length - 2] : null;
    return {
      key,
      label: DIMENSION_LABELS[key] ?? key,
      current,
      previous,
      change: current != null && previous != null ? Math.round((current - previous) * 10) / 10 : null,
      allScores: scores,
    };
  });

  // Find persistent strengths and weaknesses
  const avgByDim = dimTrends
    .filter((d) => d.allScores.length > 0)
    .map((d) => ({
      ...d,
      avg: Math.round((d.allScores.reduce((a, b) => a + b, 0) / d.allScores.length) * 10) / 10,
    }))
    .sort((a, b) => b.avg - a.avg);

  const topStrengths = avgByDim.slice(0, 2);
  const topWeaknesses = avgByDim.slice(-2).reverse();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
      >
        ← Dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">
            Your progress
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Patterns across {sessionDimAverages.length} completed session{sessionDimAverages.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Button variant="primary" size="sm" href="/session/new">
          New session
        </Button>
      </div>

      {/* Persistent insights */}
      {avgByDim.length > 0 ? (
        <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">
                Consistent strengths
              </h3>
              <ul className="mt-3 space-y-2">
                {topStrengths.map((d) => (
                  <li key={d.key} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--fg)]">{d.label}</span>
                    <span className="font-mono text-xs text-[var(--success)]">
                      {d.avg}/5 avg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Focus areas
              </h3>
              <ul className="mt-3 space-y-2">
                {topWeaknesses.map((d) => (
                  <li key={d.key} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--fg)]">{d.label}</span>
                    <span className="font-mono text-xs text-[var(--fg-muted)]">
                      {d.avg}/5 avg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* Dimension trends */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-[var(--fg-muted)]">
          Dimension scores over time
        </h2>
        <div className="mt-4 space-y-3">
          {dimTrends
            .filter((d) => d.allScores.length > 0)
            .map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--fg)]">
                    {d.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {d.current != null ? (
                      <span className="font-mono text-sm text-[var(--fg)]">
                        {d.current}/5
                      </span>
                    ) : null}
                    {d.change != null ? (
                      <span
                        className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          d.change > 0
                            ? "bg-[var(--success-muted)] text-[var(--success)]"
                            : d.change < 0
                              ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                              : "bg-[var(--surface-raised)] text-[var(--fg-subtle)]"
                        }`}
                      >
                        {d.change > 0 ? (
                          <TrendingUp size={10} />
                        ) : d.change < 0 ? (
                          <TrendingDown size={10} />
                        ) : (
                          <Minus size={10} />
                        )}
                        {d.change > 0 ? "+" : ""}
                        {d.change}
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="mt-3 flex items-end gap-1 h-8">
                  {d.allScores.map((score, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-[var(--accent)] transition-all"
                      style={{
                        height: `${Math.max(4, (score / 5) * 32)}px`,
                        opacity: i === d.allScores.length - 1 ? 1 : 0.3,
                      }}
                      title={`Session ${i + 1}: ${score}/5`}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Session history */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-[var(--fg-muted)]">
          Session history
        </h2>
        <div className="mt-4 space-y-2">
          {sessionDimAverages.map((s) => (
            <Link
              key={s.sessionId}
              href={`/session/${s.sessionId}/results`}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)]"
            >
              <div>
                <span className="font-medium text-[var(--fg)]">
                  {s.company} · {s.role}
                </span>
                <span className="ml-2 text-xs text-[var(--fg-subtle)]">
                  {s.date}
                </span>
              </div>
              <span className="font-mono text-sm font-medium text-[var(--accent)]">
                {s.overall}/100
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
