import Image from "next/image";
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
          >
            <Image src="/logo.svg" alt="Intrvw.ai" width={120} height={32} className="h-7 w-auto" />
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
