"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not delete account");
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete account");
      setPending(false);
    }
  }

  return (
    <div className="mt-16 border-t border-[var(--border)] pt-8">
      <h2 className="text-sm font-medium text-[var(--fg)]">Delete account</h2>
      <p className="mt-1 max-w-xl text-sm text-[var(--fg-muted)]">
        This removes your resume, practice sessions, transcripts, and scores.
        It cannot be undone.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {confirming ? (
          <>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirming(true)}
          >
            Delete account
          </Button>
        )}
      </div>
    </div>
  );
}
