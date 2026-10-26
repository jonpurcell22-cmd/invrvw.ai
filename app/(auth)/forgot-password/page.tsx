"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          We will email you a link to choose a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-[var(--fg-muted)]" role="status">
            Check your email for the reset link. It expires after a short time.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
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
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          <Link
            href="/login"
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
