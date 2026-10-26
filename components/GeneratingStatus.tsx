"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

// Generation runs web search plus a long Claude call — measured at 90-130s.
const EXPECTED_MS = 120_000;

// Past this we stop predicting and just keep saying we're alive.
const OVERTIME_MS = 165_000;

// The real phases of /api/session/create, so the copy tracks actual work
// rather than inventing steps.
const PHASES = [
  { until: 15_000, text: "Reading your resume and the job description" },
  { until: 55_000, text: "Researching the company and the role" },
  { until: 95_000, text: "Writing questions tailored to this interview" },
  { until: Infinity, text: "Building the scoring rubrics" },
] as const;

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function GeneratingStatus({
  includeInterviewer = false,
}: {
  includeInterviewer?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    // A ticking counter is the part that survives prefers-reduced-motion,
    // where globals.css freezes every CSS animation. Without it the screen
    // would look hung for exactly the users we're reassuring.
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, []);

  const expectedMs = includeInterviewer ? 150_000 : EXPECTED_MS;
  const overtimeMs = includeInterviewer ? 195_000 : OVERTIME_MS;
  const overtime = elapsed >= overtimeMs;
  const phases = includeInterviewer
    ? [
        PHASES[0],
        {
          until: 70_000,
          text: "Researching the company, the role, and your interviewer",
        },
        {
          until: 110_000,
          text: "Writing questions this interviewer would ask",
        },
        PHASES[3],
      ]
    : PHASES;
  const phase = phases.find((p) => elapsed < p.until) ?? phases[phases.length - 1];

  // Ease toward 95% but never reach it — a bar that sits full while the user
  // keeps waiting reads as broken.
  const percent = Math.min(95, (elapsed / expectedMs) * 95);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Loader2 size={32} className="animate-spin text-[var(--accent)]" />

      <h2 className="mt-6 text-xl font-bold text-[var(--fg)]">
        Building your interview
      </h2>

      <p
        className="mt-2 max-w-sm text-sm text-[var(--fg-muted)]"
        role="status"
        aria-live="polite"
      >
        {overtime
          ? "Still working — this one is taking longer than usual. Hang tight, we haven't timed out."
          : `${phase.text}. This usually takes 1–2 minutes.`}
      </p>

      <div className="mt-8 w-full max-w-xs">
        <ProgressBar value={percent} max={100} />
        <p className="mt-3 font-mono text-xs tabular-nums text-[var(--fg-subtle)]">
          {formatElapsed(elapsed)} elapsed
        </p>
      </div>
    </div>
  );
}
