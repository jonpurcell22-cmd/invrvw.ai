import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAnonymous = !user || user.is_anonymous;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Link
              href={isAnonymous ? "/" : "/dashboard"}
              className="text-sm font-bold tracking-tight"
            >
              <span className="text-gradient">PrepIQ</span>
            </Link>
            {!isAnonymous ? (
              <nav className="hidden items-center gap-6 text-sm text-[var(--fg-muted)] sm:flex">
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-[var(--fg)]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/session/new"
                  className="transition-colors hover:text-[var(--fg)]"
                >
                  New session
                </Link>
              </nav>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {isAnonymous ? (
              <>
                <Link
                  href="/login"
                  className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                >
                  Log in
                </Link>
                <Button variant="primary" size="sm" href="/signup">
                  Sign up
                </Button>
              </>
            ) : (
              <>
                <LogoutButton />
                <Button variant="primary" size="sm" href="/session/new">
                  Practice
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
