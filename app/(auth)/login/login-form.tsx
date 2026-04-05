"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

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
            href="/signup"
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
