"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const supabase = createSupabaseBrowserClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(name ? { data: { full_name: name } } : {}),
      },
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    if (data.session) {
      // Send welcome email (fire and forget)
      fetch("/api/email/welcome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      }).catch(() => {});

      router.push("/dashboard");
      router.refresh();
      setPending(false);
      return;
    }

    setInfo(
      "Check your email to confirm your account, then log in. (Disable \u201cConfirm email\u201d in Supabase Auth settings for faster local testing.)",
    );
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Free for now — no paywall in v1.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Jordan Lee"
          />
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
            autoComplete="new-password"
            required
          />
          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-[var(--fg-muted)]" role="status">
              {info}
            </p>
          ) : null}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
