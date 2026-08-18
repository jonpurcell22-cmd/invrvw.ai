"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Mic } from "lucide-react";

export type ResultRow = {
  questionId: string;
  questionText: string;
  category: string;
  score: number;
  transcript: string | null;
  feedbackRaw: string | null;
  modelAnswer: string | null;
};

type ParsedDimension = { score: number; feedback: string };
type ParsedFeedback = {
  dimensions?: Record<string, ParsedDimension>;
  overallScore1To5?: number;
  deliveryFeedback?: string;
} | null;

function parseFeedback(raw: string | null): ParsedFeedback {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NonNullable<ParsedFeedback>;
  } catch {
    return null;
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-[var(--success)]";
  if (score >= 50) return "text-[var(--info)]";
  if (score >= 25) return "text-[var(--warning)]";
  return "text-[var(--danger)]";
}

function scoreTone(score: number): "success" | "warning" | "info" | "neutral" {
  if (score >= 75) return "success";
  if (score >= 50) return "info";
  if (score >= 25) return "warning";
  return "neutral";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Solid";
  if (score >= 40) return "Developing";
  return "Needs work";
}

const DIMENSION_LABELS: Record<string, string> = {
  relevance: "Relevance",
  structure: "Structure",
  specificity: "Specificity",
  impact_articulation: "Impact",
  communication_clarity: "Clarity",
  analytical_reasoning: "Reasoning",
  values_culture_signal: "Values",
};

/** Split the 4-part model answer into structured sections */
function parseModelAnswer(raw: string | null): {
  callback: string | null;
  improvement: string | null;
  strongerVersion: string | null;
  oneThing: string | null;
} {
  if (!raw) return { callback: null, improvement: null, strongerVersion: null, oneThing: null };

  const parts = raw.split("\n\n").filter((p) => p.trim());

  // The last part starting with "Before your next practice session" is Part 4
  let oneThingIdx = parts.findIndex((p) =>
    p.toLowerCase().startsWith("before your next practice session"),
  );

  // If we can't find it by prefix, assume last part
  if (oneThingIdx === -1 && parts.length >= 4) {
    oneThingIdx = parts.length - 1;
  }

  if (parts.length < 3) {
    // Fallback: can't parse structure, return as single block
    return { callback: null, improvement: null, strongerVersion: raw, oneThing: null };
  }

  const callback = parts[0] ?? null;
  const improvement = parts[1] ?? null;
  const oneThing = oneThingIdx >= 0 ? parts[oneThingIdx] ?? null : null;

  // Everything between improvement and oneThing is the stronger version
  const strongerStart = 2;
  const strongerEnd = oneThingIdx >= 0 ? oneThingIdx : parts.length;
  const strongerVersion =
    parts.slice(strongerStart, strongerEnd).join("\n\n") || null;

  return { callback, improvement, strongerVersion, oneThing };
}

/** Compact score bar for dimension visualization */
function DimensionBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const color =
    score >= 4
      ? "bg-[var(--success)]"
      : score >= 3
        ? "bg-[var(--info)]"
        : score >= 2
          ? "bg-[var(--warning)]"
          : "bg-[var(--danger)]";
  return (
    <div className="h-1 w-full rounded-full bg-[var(--surface-raised)]">
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function QuestionResult({ row }: { row: ResultRow }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const parsed = parseFeedback(row.feedbackRaw);
  const model = parseModelAnswer(row.modelAnswer);

  // Find top strengths and weaknesses from dimensions
  const dims = parsed?.dimensions;
  let topStrength: { key: string; dim: ParsedDimension } | null = null;
  let topWeakness: { key: string; dim: ParsedDimension } | null = null;
  if (dims) {
    const entries = Object.entries(dims);
    const sorted = [...entries].sort((a, b) => b[1].score - a[1].score);
    if (sorted.length > 0) topStrength = { key: sorted[0][0], dim: sorted[0][1] };
    if (sorted.length > 1) topWeakness = { key: sorted[sorted.length - 1][0], dim: sorted[sorted.length - 1][1] };
  }

  return (
    <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all duration-200 open:shadow-[var(--shadow-elevated)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium leading-snug text-[var(--fg)]">
            {row.questionText}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`font-mono text-sm font-bold ${scoreColor(row.score)}`}>
            {row.score}
          </span>
          <Badge tone={scoreTone(row.score)}>{scoreLabel(row.score)}</Badge>
        </div>
      </summary>

      <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 space-y-5">

        {/* Score bar + quick dimension overview */}
        {dims ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-1.5">
            {Object.entries(dims).map(([k, v]) => (
              <div key={k} className="space-y-1">
                <DimensionBar score={v.score} />
                <p className="text-center text-[11px] leading-tight text-[var(--fg-subtle)]">
                  {DIMENSION_LABELS[k] ?? k}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Your answer — collapsed by default */}
        {row.transcript ? (
          <div>
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              {showTranscript ? "Hide your answer" : "Show your answer"}
            </button>
            {showTranscript ? (
              <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                <p className="text-sm leading-relaxed text-[var(--fg-muted)]">
                  {row.transcript}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Coaching: What worked + What to improve */}
        {model.callback || model.improvement ? (
          <div className="space-y-3">
            {model.callback ? (
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden="true">+</span>
                <p className="text-sm leading-relaxed text-[var(--fg)]">
                  {model.callback}
                </p>
              </div>
            ) : topStrength ? (
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden="true">+</span>
                <p className="text-sm leading-relaxed text-[var(--fg)]">
                  {topStrength.dim.feedback}
                </p>
              </div>
            ) : null}

            {model.improvement ? (
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-[var(--info)]" aria-hidden="true">&uarr;</span>
                <p className="text-sm leading-relaxed text-[var(--fg)]">
                  {model.improvement}
                </p>
              </div>
            ) : topWeakness && topWeakness.dim.score < 4 ? (
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-[var(--info)]" aria-hidden="true">&uarr;</span>
                <p className="text-sm leading-relaxed text-[var(--fg)]">
                  {topWeakness.dim.feedback}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Delivery coaching */}
        {parsed?.deliveryFeedback ? (
          <div className="flex gap-3">
            <Mic size={14} className="mt-1 shrink-0 text-[var(--fg-subtle)]" />
            <p className="text-sm leading-relaxed text-[var(--fg-muted)]">
              {parsed.deliveryFeedback}
            </p>
          </div>
        ) : null}

        {/* Stronger version */}
        {model.strongerVersion ? (
          <div className="rounded-lg border border-[var(--accent)]/15 bg-[var(--accent-muted)] px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Stronger version
              </h3>
              <span className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                Built from your resume
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {model.strongerVersion.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-[var(--fg)]"
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        ) : row.modelAnswer && !model.callback ? (
          /* Fallback for old-format model answers without 4-part structure */
          <div className="rounded-lg border border-[var(--accent)]/15 bg-[var(--accent-muted)] px-4 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Stronger version
            </h3>
            <div className="mt-3 space-y-2.5">
              {row.modelAnswer.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-[var(--fg)]"
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {/* One thing to practice */}
        {model.oneThing ? (
          <div className="rounded-lg border border-[var(--info)]/15 bg-[var(--info-muted)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--info)]">
              {model.oneThing}
            </p>
          </div>
        ) : null}

        {/* Detailed scoring toggle */}
        {dims ? (
          <div>
            <button
              type="button"
              onClick={() => setShowScoring(!showScoring)}
              className="text-xs font-medium text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
            >
              {showScoring ? "Hide detailed scoring" : "Show detailed scoring"}
            </button>
            {showScoring ? (
              <ul className="mt-3 space-y-2">
                {Object.entries(dims).map(([k, v]) => (
                  <li
                    key={k}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--fg)]">
                        {DIMENSION_LABELS[k] ?? k.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-xs text-[var(--accent)]">
                        {v.score}/5
                      </span>
                    </div>
                    <p className="mt-1.5 text-[var(--fg-muted)]">
                      {v.feedback}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}

type ParsedSummary = {
  headline: string;
  strengths: string[];
  improvements: string[];
};

function parseSummary(raw: string | null): ParsedSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ParsedSummary;
    if (parsed.headline && Array.isArray(parsed.strengths) && Array.isArray(parsed.improvements)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function ResultsView({
  sessionId,
  overallScore,
  rows,
  summaryRaw,
}: {
  sessionId: string;
  overallScore: number;
  rows: ResultRow[];
  summaryRaw: string | null;
}) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleRetry() {
    setResetError(null);
    setResetting(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/reset`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Reset failed");
      }
      router.push(`/session/${sessionId}/questions`);
      router.refresh();
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "Reset failed");
      setResetting(false);
    }
  }

  return (
    <>
      <header className="mt-6 border-b border-[var(--border)] pb-10">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
          Your results
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--fg-muted)]">
          Review your answers, see what worked, and practice the stronger
          versions.
        </p>
        <div className="mt-8">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-4xl font-bold tracking-tight text-[var(--accent)] sm:text-5xl">
              {overallScore}
            </span>
            <div className="space-y-0.5">
              <span className="block text-sm font-medium text-[var(--fg)]">
                {scoreLabel(overallScore)}
              </span>
              <span className="block text-xs text-[var(--fg-muted)]">
                out of 100
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Session trends summary */}
      {(() => {
        const summary = parseSummary(summaryRaw);
        if (!summary) return null;
        return (
          <section className="mt-10 animate-fade-up">
            <div className="glass gradient-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-medium leading-relaxed text-[var(--fg)]">
                {summary.headline}
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* Strengths */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">
                    Working well
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {summary.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden="true">+</span>
                        <span className="text-[var(--fg-muted)]">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--info)]">
                    Focus on next
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {summary.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="mt-0.5 shrink-0 text-[var(--info)]" aria-hidden="true">&uarr;</span>
                        <span className="text-[var(--fg-muted)]">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      <section className="mt-10 space-y-4">
        <h2 className="text-sm font-medium text-[var(--fg-muted)]">
          Question by question
        </h2>
        <ul className="stagger-children space-y-3">
          {rows.map((row) => (
            <li key={row.questionId}>
              <QuestionResult row={row} />
            </li>
          ))}
        </ul>
      </section>

      {resetError ? (
        <p className="mt-6 text-sm text-[var(--danger)]" role="alert">
          {resetError}
        </p>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={resetting}
          onClick={handleRetry}
        >
          {resetting ? "Resetting…" : "Retry this session"}
        </Button>
        <Button variant="primary" href="/session/new">
          Start new session
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
        >
          Dashboard
        </Link>
      </div>
    </>
  );
}
