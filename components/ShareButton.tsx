"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Check, Gift } from "lucide-react";

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

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
      const data = (await res.json()) as {
        sent?: boolean;
        mailto?: string;
        error?: string;
      };

      if (data.error) {
        setError(data.error);
        setSending(false);
        return;
      }

      // If server couldn't send (no Resend key), fall back to mailto
      if (data.mailto && !data.sent) {
        window.open(data.mailto, "_blank");
      }

      setSent(true);
      setEmail("");
      setError(null);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 2500);
    } catch {
      // Non-critical
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
    <div className="relative" ref={panelRef}>
      {/* Dropdown panel */}
      {open ? (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 animate-fade-in rounded-xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-4 shadow-[var(--shadow-elevated)] z-50">
          {sent ? (
            <div className="flex items-center gap-2 py-2 text-sm text-[var(--success)]">
              <Check size={16} />
              <span>Invite sent — you're a good friend</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--fg)]">
                  Help a friend ace their interview
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
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--fg-subtle)]">
                Send them a free invite. No signup needed on their end — they
                can start practicing immediately.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="their@email.com"
                  className="flex h-11 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!email.trim().includes("@") || sending}
                  className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                  Send
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSent(false);
        }}
        className="flex h-9 min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] sm:px-3.5"
        aria-label="Invite a friend to Intrvw.ai"
      >
        <Gift size={14} />
        <span className="hidden sm:inline">Invite a friend</span>
      </button>
    </div>
  );
}
