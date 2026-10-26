"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement)
      .value;
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        {ready === null ? (
          <p className="text-sm text-[var(--fg-muted)]">Checking your reset link…</p>
        ) : ready ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              label="Confirm password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
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
              {pending ? "Saving…" : "Save password"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-[var(--fg-muted)]">
            This reset link is missing or expired.{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Request a new one
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
