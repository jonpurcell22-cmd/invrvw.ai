import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-[var(--fg)]"
          >
            intrvw<span className="text-[var(--accent)]">.ai</span>
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
