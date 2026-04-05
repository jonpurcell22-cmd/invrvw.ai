import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg)]">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--fg)]"
        >
          intrvw<span className="text-[var(--accent)]">.ai</span>
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
