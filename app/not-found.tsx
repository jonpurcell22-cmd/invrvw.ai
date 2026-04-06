import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-24">
      <p className="font-mono text-sm text-[var(--fg-subtle)]">404</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--fg)]">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="primary" size="md" href="/">
          Go home
        </Button>
        <Button variant="secondary" size="md" href="/session/new">
          Start practicing
        </Button>
      </div>
    </div>
  );
}
