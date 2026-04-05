import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full space-y-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--fg)]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`flex h-10 w-full rounded-xl border bg-[var(--surface-solid)] px-3.5 text-sm text-[var(--fg)] shadow-sm transition-all placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:border-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-40 ${error ? "border-[var(--danger)]/50" : "border-[var(--border-strong)]"} ${className}`}
        {...props}
      />
      {hint && !error ? (
        <p className="text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
