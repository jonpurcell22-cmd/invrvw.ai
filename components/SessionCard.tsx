import Link from "next/link";
import type { Session } from "@/types";
import { Badge } from "@/components/ui/Badge";

const statusTone: Record<
  Session["status"],
  "neutral" | "success" | "warning" | "info" | "muted"
> = {
  draft: "muted",
  in_progress: "info",
  generating_questions: "warning",
  awaiting_answers: "info",
  scoring: "warning",
  completed: "success",
  archived: "neutral",
};

function formatStatus(status: Session["status"]): string {
  return status.replace(/_/g, " ");
}

export function SessionCard({ session }: { session: Session }) {
  const date = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={
        session.status === "completed"
          ? `/session/${session.id}/results`
          : `/session/${session.id}/questions`
      }
      className="group relative block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--accent)]/20 hover:shadow-[var(--shadow-glow)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--fg)]">
            {session.roleTitle ?? "Untitled role"}
          </p>
          <p className="mt-1 truncate text-sm text-[var(--fg-muted)]">
            {session.companyName ?? "Company TBD"}
          </p>
        </div>
        <Badge tone={statusTone[session.status]}>
          {formatStatus(session.status)}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--fg-subtle)]">
        <span>{date}</span>
        {session.overallScore != null ? (
          <span className="font-mono font-medium text-[var(--accent)]">
            {session.overallScore}/100
          </span>
        ) : (
          <span>—</span>
        )}
      </div>
    </Link>
  );
}
