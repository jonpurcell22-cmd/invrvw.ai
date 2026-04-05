import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg)]">
      <header className="px-6 py-6">
        <Link href="/" className="text-sm font-bold tracking-tight">
          <span className="text-gradient">PrepIQ</span>
        </Link>
      </header>
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-24">
        {/* Background gradient blobs */}
        <div className="hero-mesh" aria-hidden="true">
          <div className="blob" style={{ opacity: 0.15 }} />
          <div className="blob" style={{ opacity: 0.12 }} />
          <div className="blob" style={{ opacity: 0.1 }} />
        </div>
        <div className="relative w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
