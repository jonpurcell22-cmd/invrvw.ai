export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className = "",
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-[var(--fg-muted)]">{label}</span>
          <span className="font-mono font-medium text-[var(--accent)]">
            {Math.round(pct)}%
          </span>
        </div>
      ) : null}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-raised)]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
