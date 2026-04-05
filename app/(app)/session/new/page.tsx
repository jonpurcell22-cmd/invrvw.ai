import Link from "next/link";
import { NewSessionForm } from "./new-session-form";

export default function NewSessionPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-10 animate-fade-up">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
          New practice session
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Upload your resume and job description. We use Claude to infer role
          level, research the company on the web, and create 8–12 scored
          practice questions.
        </p>
      </div>

      <NewSessionForm />
    </main>
  );
}
