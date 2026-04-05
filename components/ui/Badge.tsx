import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  neutral:
    "bg-[var(--surface-raised)] text-[var(--fg-muted)] border-[var(--border-strong)]",
  success:
    "bg-[var(--success-muted)] text-emerald-700 border-emerald-200",
  warning:
    "bg-[var(--warning-muted)] text-amber-700 border-amber-200",
  info: "bg-[var(--info-muted)] text-blue-700 border-blue-200",
  muted:
    "bg-transparent text-[var(--fg-subtle)] border-[var(--border)]",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
