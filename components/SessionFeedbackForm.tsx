"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const FIELDS = [
  {
    name: "stuck",
    label: "Where did you get stuck?",
    placeholder: "A step that confused you, a wait that felt too long, a mic that failed…",
  },
  {
    name: "useful",
    label: "What was useful?",
    placeholder: "The question, the score, or the model answer that actually helped.",
  },
  {
    name: "change",
    label: "What would you change?",
    placeholder: "One thing that would make the next session easier.",
  },
] as const;

export function SessionFeedbackForm({
  sessionId,
  initial,
}: {
  sessionId: string;
  initial: { stuck: string; useful: string; change: string };
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/session/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, ...values }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save feedback");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback");
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold text-[var(--fg)]">Thanks, that helps.</h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Your note is saved with this session.
        </p>
        <div className="mt-6">
          <Button variant="primary" href="/dashboard">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
    >
      <div className="space-y-5">
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-[var(--fg)]"
            >
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={4}
              maxLength={2000}
              value={values[field.name]}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  [field.name]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
              className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
            />
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/session/${sessionId}/results`}
          className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Back to results
        </Link>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
