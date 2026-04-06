"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function RetrySessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRetry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/session/${sessionId}/questions`);
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={pending}
      className="flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface-hover)] px-2 py-1 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] disabled:opacity-40"
      title="Reset and practice again"
    >
      <RotateCcw size={11} />
      {pending ? "Resetting…" : "Practice again"}
    </button>
  );
}
