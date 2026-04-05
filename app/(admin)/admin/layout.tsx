import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="text-sm font-bold tracking-tight text-[var(--fg)]"
            >
              <span className="text-gradient">PrepIQ</span>{" "}
              <span className="font-normal text-[var(--fg-subtle)]">Admin</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-[var(--fg-muted)] sm:flex">
              <Link
                href="/admin"
                className="transition-colors hover:text-[var(--fg)]"
              >
                Users
              </Link>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-[var(--fg)]"
              >
                App
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
