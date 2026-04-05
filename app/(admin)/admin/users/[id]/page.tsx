"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type UserInfo = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignIn: string | null;
};

type SessionRow = {
  id: string;
  created_at: string;
  company_name: string | null;
  role_title: string | null;
  interview_stage: string | null;
  seniority_level: string | null;
  status: string;
  overall_score: number | null;
  questionCount: number;
  responseCount: number;
};

export default function AdminUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          throw new Error(j.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          user: UserInfo;
          sessions: SessionRow[];
        };
        setUser(data.user);
        setSessions(data.sessions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const statusTone = (status: string) => {
    switch (status) {
      case "completed":
        return "success" as const;
      case "awaiting_answers":
        return "warning" as const;
      case "scoring":
        return "info" as const;
      default:
        return "neutral" as const;
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-shimmer rounded-lg" />
          <div className="h-4 w-96 animate-shimmer rounded" />
          <div className="mt-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-shimmer rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <Link
          href="/admin"
          className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
        >
          ← Users
        </Link>
        <p className="mt-8 text-sm text-[var(--danger)]" role="alert">
          {error ?? "User not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
      >
        ← Users
      </Link>

      <header className="mt-6 animate-fade-up border-b border-[var(--border)] pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
          {user.email ?? user.id.slice(0, 8)}
        </h1>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--fg-muted)]">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
              Joined
            </dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
              Last sign-in
            </dt>
            <dd>{formatDate(user.lastSignIn)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
              Sessions
            </dt>
            <dd className="font-mono text-[var(--accent)]">
              {sessions.length}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-[var(--fg-muted)]">
          Sessions
        </h2>

        {sessions.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--fg-subtle)]">
            No sessions yet.
          </p>
        ) : (
          <ul className="stagger-children mt-4 space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={
                    s.status === "completed"
                      ? `/session/${s.id}/results`
                      : `/session/${s.id}/questions`
                  }
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--accent)]/20 hover:shadow-[var(--shadow-glow)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--fg)]">
                        {s.company_name ?? "Unknown company"}
                        {s.role_title ? ` · ${s.role_title}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                        {s.interview_stage ?? "—"}
                        {s.seniority_level ? ` · ${s.seniority_level}` : ""}
                        {" · "}
                        {s.questionCount} questions, {s.responseCount} answered
                        {" · "}
                        {formatDateTime(s.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.overall_score != null ? (
                        <span className="font-mono text-sm font-bold text-[var(--accent)]">
                          {s.overall_score}/100
                        </span>
                      ) : null}
                      <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
