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
    "bg-white text-[var(--bg)] font-medium hover:bg-white/90 border border-white/20 active:scale-[0.98] shadow-[0_0_15px_rgba(253,176,81,0.35),0_0_30px_rgba(242,32,62,0.25),0_0_50px_rgba(83,66,214,0.2),0_0_80px_rgba(242,32,62,0.1)]",
  secondary:
    "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:border-[var(--fg-subtle)]/30 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] border border-transparent active:scale-[0.98]",
  danger:
    "bg-[var(--danger)] text-white font-medium hover:brightness-110 border border-[var(--danger)] active:scale-[0.98]",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 min-h-[44px] px-3.5 text-xs gap-1.5 rounded-lg",
  md: "h-10 min-h-[44px] px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 min-h-[44px] px-5 text-sm gap-2 rounded-lg",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
  } = props;
  const classes = `inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 ${variantClass[variant]} ${sizeClass[size]} ${className}`;

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
