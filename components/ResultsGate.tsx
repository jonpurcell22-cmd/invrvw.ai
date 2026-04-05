"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function ResultsGate({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const supabase = createSupabaseBrowserClient();

    if (mode === "signup") {
      const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;

      // Link anonymous account to a real one via updateUser
      const { error: updateErr } = await supabase.auth.updateUser({
        email,
        password,
        data: name ? { full_name: name } : undefined,
      });

      if (updateErr) {
        // If linking fails (email exists), try signing in instead
        if (
          updateErr.message.includes("already") ||
          updateErr.message.includes("exists")
        ) {
          setError("An account with that email already exists. Try logging in.");
          setMode("login");
          setPending(false);
          return;
        }
        setError(updateErr.message);
        setPending(false);
        return;
      }

      // Success — anonymous user is now a real user
      router.refresh();
      setPending(false);
    } else {
      // Login: sign in with password, which replaces the anonymous session
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signError) {
        setError(signError.message);
        setPending(false);
        return;
      }

      // After login, the anonymous session's data is orphaned.
      // But the user's real account sessions are now accessible.
      // Redirect to dashboard since this session belongs to anonymous user.
      router.push("/dashboard");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div className="h-[300px] w-[400px] rounded-full bg-[var(--accent)] opacity-[0.03] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)]">
            <span className="text-2xl font-bold text-white">
              ✓
            </span>
          </div>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-[var(--fg)]">
            Your results are ready
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Create a free account to see your scores, personalized feedback, and
            stronger answer examples.
          </p>
        </div>

        <div className="mt-8 glass gradient-border rounded-2xl shadow-[var(--shadow-card)]">
          {/* Mode tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "border-b-2 border-[var(--accent)] text-gradient font-semibold"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "border-b-2 border-[var(--accent)] text-gradient font-semibold"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Log in
            </button>
          </div>

          <form className="space-y-4 p-6" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <Input
                label="Name"
                name="name"
                autoComplete="name"
                placeholder="Your name"
              />
            ) : null}
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
            />
            {error ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={pending}
            >
              {pending
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account & view results"
                  : "Sign in & view results"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--fg-subtle)]">
          Free during early access. No credit card required.
        </p>
      </div>
    </div>
  );
}
