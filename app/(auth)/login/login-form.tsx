"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { safeNextPath } from "@/lib/safe-next";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const linkError = searchParams.get("error") === "link";

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
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    router.push(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Use the email and password for your Intrvw.ai account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            required
          />
          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="text-[var(--fg-muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              Forgot password?
            </Link>
          </p>
          {linkError ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              That link expired. Request a new password reset.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Continue"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          No account?{" "}
          <Link
            href={
              nextPath === "/dashboard"
                ? "/signup"
                : `/signup?next=${encodeURIComponent(nextPath)}`
            }
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
