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
          Upload your resume and the job description. Add the LinkedIn profile
          of the person who will interview you, and we research them along
          with the company. Questions, scores, and model answers are shaped
          around that interview. You can start three sessions a day. Your
          resume and answers stay in your account and are not shared with
          your instructor.
        </p>
      </div>

      <NewSessionForm />
    </main>
  );
}
