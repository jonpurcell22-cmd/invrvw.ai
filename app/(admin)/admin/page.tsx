"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type UserRow = {
  id: string;
  email: string | null;
  registered: boolean;
  createdAt: string;
  lastSignIn: string | null;
  sessionCount: number;
  completedCount: number;
  latestSession: {
    companyName: string | null;
    roleTitle: string | null;
    status: string;
    createdAt: string;
  } | null;
};

const PAGE_SIZE = 25;

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { users: UserRow[] };
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const data = (await res.json()) as {
        sessionId?: string;
        resultsUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      router.push(data.resultsUrl!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
      setSeeding(false);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
            Users
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
            All registered users and their interview session activity.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? "Seeding…" : "Seed test session"}
        </Button>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-12">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-shimmer rounded-xl"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">No users with sessions yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Sessions</th>
                    <th className="hidden px-5 py-3 sm:table-cell">
                      Latest session
                    </th>
                    <th className="px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                    >
                      <td className="px-5 py-4 font-medium text-[var(--fg)]">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="hover:text-[var(--accent)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {u.email ?? (
                            <span className="text-[var(--fg-muted)]">
                              Guest · {u.id.slice(0, 8)}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={u.registered ? "success" : "warning"}>
                          {u.registered ? "Registered" : "Incomplete"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-[var(--fg-muted)]">
                        {u.completedCount}/{u.sessionCount}
                      </td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        {u.latestSession ? (
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[var(--fg-muted)]">
                              {u.latestSession.companyName ?? "—"}{" "}
                              {u.latestSession.roleTitle
                                ? `· ${u.latestSession.roleTitle}`
                                : ""}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[var(--fg-subtle)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[var(--fg-subtle)]">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.length > PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-[var(--fg-subtle)]">
                  Showing {page * PAGE_SIZE + 1}–
                  {Math.min((page + 1) * PAGE_SIZE, users.length)} of{" "}
                  {users.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        (p + 1) * PAGE_SIZE < users.length ? p + 1 : p,
                      )
                    }
                    disabled={(page + 1) * PAGE_SIZE >= users.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
