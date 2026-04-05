import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ScoreDisplayProps {
  /** 1–5 scale */
  score: number;
  /** Optional 0–100 normalized view */
  showNormalized?: boolean;
  label?: string;
}

function normalizedFromFive(score: number): number {
  const clamped = Math.min(5, Math.max(1, score));
  return Math.round(((clamped - 1) / 4) * 100);
}

export function ScoreDisplay({
  score,
  showNormalized = true,
  label = "Score",
}: ScoreDisplayProps) {
  const n = normalizedFromFive(score);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--fg-muted)]">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{score.toFixed(1)} / 5</Badge>
          {showNormalized ? (
            <span className="font-mono text-xs text-[var(--accent)]">
              {n}/100
            </span>
          ) : null}
        </div>
      </div>
      <ProgressBar value={n} max={100} />
    </div>
  );
}
