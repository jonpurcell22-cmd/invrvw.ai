import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Shared = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export type ButtonProps = Shared &
  (
    | { href: string }
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

const variantClass: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[var(--grad-start)] via-[var(--grad-mid)] to-[var(--grad-end)] text-white font-semibold shadow-[0_2px_12px_rgba(124,58,237,0.25),0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.35),0_2px_6px_rgba(0,0,0,0.1)] hover:brightness-110 border border-white/20 active:scale-[0.97]",
  secondary:
    "bg-[var(--surface-solid)] text-[var(--fg)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-[var(--fg-subtle)]/20 active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-black/[0.04] border border-transparent active:scale-[0.97]",
  danger:
    "bg-[var(--danger)] text-white font-semibold shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:brightness-110 border border-white/20 active:scale-[0.97]",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5 rounded-xl",
  md: "h-10 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2 rounded-2xl",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
  } = props;
  const classes = `inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 ${variantClass[variant]} ${sizeClass[size]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const btn = props as Shared & ButtonHTMLAttributes<HTMLButtonElement>;
  const {
    variant: _omitVariant,
    size: _omitSize,
    className: _omitClassName,
    type = "button",
    children: _omitChildren,
    ...domProps
  } = btn;
  void _omitVariant;
  void _omitSize;
  void _omitClassName;
  void _omitChildren;

  return (
    <button {...domProps} className={classes} type={type}>
      {children}
    </button>
  );
}
