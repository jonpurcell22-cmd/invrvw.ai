import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  neutral:
    "bg-[var(--surface-raised)] text-[var(--fg-muted)] border-[var(--border-strong)]",
  success:
    "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/20",
  warning:
    "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/20",
  info: "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info)]/20",
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
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
