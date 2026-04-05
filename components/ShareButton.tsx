"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Check } from "lucide-react";

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSent(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@") || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, senderName: "A friend" }),
      });
      const data = (await res.json()) as { mailto?: string };

      // Open mailto link to send via user's email client
      if (data.mailto) {
        window.open(data.mailto, "_blank");
      }

      setSent(true);
      setEmail("");
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 2000);
    } catch {
      // Silently fail — not critical
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setOpen(false);
      setSent(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>
      {/* Share panel */}
      {open ? (
        <div className="mb-3 w-72 animate-fade-up rounded-xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-4 shadow-[var(--shadow-elevated)]">
          {sent ? (
            <div className="flex items-center gap-2 py-2 text-sm text-[var(--success)]">
              <Check size={16} />
              <span>Link shared</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--fg)]">
                  Share Intrvw.ai
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSent(false);
                  }}
                  className="cursor-pointer rounded-md p-1 text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                Know someone with an interview coming up?
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="their@email.com"
                  className="flex h-9 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!email.trim().includes("@") || sending}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSent(false);
        }}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-solid)] px-4 text-sm font-medium text-[var(--fg-muted)] shadow-[var(--shadow-card)] transition-all duration-150 hover:border-[var(--accent)]/30 hover:text-[var(--fg)]"
        aria-label="Share Intrvw.ai"
      >
        <Send size={14} />
        <span className="hidden sm:inline">Share</span>
      </button>
    </div>
  );
}
