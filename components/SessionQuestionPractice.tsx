"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { AudioRecording } from "@/lib/audio";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

export type PracticeQuestionRow = {
  id: string;
  question_text: string;
  question_category: string;
  question_order: number;
};

export function SessionQuestionPractice({
  sessionId,
  questions,
  startIndex,
}: {
  sessionId: string;
  questions: PracticeQuestionRow[];
  startIndex: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, questions.length - 1)),
  );
  const [transcript, setTranscript] = useState("");
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<AudioRecording | null>(null);

  const current = questions[index];
  const total = questions.length;

  if (!current) {
    return (
      <p className="text-sm text-[var(--fg-muted)]">No questions in session.</p>
    );
  }

  async function handleSubmit() {
    const t = transcript.trim();
    if (!t || scoring) return;
    setError(null);
    setScoring(true);

    const wordCount = t.split(/\s+/).filter(Boolean).length;
    const durationSec = audioRef.current?.durationSec ?? null;
    const wordsPerMinute =
      durationSec && durationSec > 0
        ? Math.round((wordCount / durationSec) * 60)
        : null;

    try {
      const res = await fetch("/api/session/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: current.id,
          transcript: t,
          speechMeta: {
            durationSec: durationSec ? Math.round(durationSec) : null,
            wordCount,
            wordsPerMinute,
          },
        }),
      });
      const data = (await res.json()) as {
        score?: number;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Scoring failed");
      }
      setLastScore(data.score ?? null);
      setScored(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  }

  function handleNext() {
    if (index >= total - 1) {
      router.push(`/session/${sessionId}/results`);
      router.refresh();
      return;
    }
    setIndex((i) => i + 1);
    setTranscript("");
    setScored(false);
    setLastScore(null);
    setError(null);
    audioRef.current = null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--fg-subtle)] transition-colors hover:text-[var(--fg-muted)]"
          >
            ← Dashboard
          </Link>
          <p className="mt-3 font-mono text-xs text-[var(--fg-subtle)]">
            Session {sessionId}
          </p>
        </div>
        <div className="w-full max-w-xs sm:w-56">
          <ProgressBar label="Progress" value={index + 1} max={total} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">
          Question {index + 1} of {total}
        </Badge>
        <Badge tone="neutral">{current.question_category}</Badge>
      </div>

      <div className="animate-fade-up">
        <h1 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
          {current.question_text}
        </h1>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Record your answer or upload audio. You can edit the transcript before
          submitting.
        </p>
      </div>

      <VoiceRecorder
        key={current.id}
        onTranscript={setTranscript}
        onAudioRecording={(rec) => { audioRef.current = rec; }}
        disabled={scoring || scored}
      />

      <div className="space-y-2">
        <label
          htmlFor="transcript"
          className="block text-sm font-medium text-[var(--fg-muted)]"
        >
          Transcript
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={scoring || scored}
          rows={5}
          placeholder="Your answer appears here — edit if needed."
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm text-[var(--fg)] shadow-sm transition-colors placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:border-[var(--accent)]/30 disabled:opacity-40"
        />
      </div>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {scored && lastScore != null ? (
        <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-muted)] px-5 py-4 text-sm text-[var(--accent)]">
          Score for this question:{" "}
          <span className="font-mono font-bold text-lg">{lastScore}</span>
          <span className="text-[var(--fg-muted)]">/100</span>
          <span className="ml-2 text-[var(--fg-subtle)]">
            — Full breakdown on the results page.
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
        {!scored ? (
          <Button
            type="button"
            variant="primary"
            disabled={!transcript.trim() || scoring}
            onClick={handleSubmit}
          >
            {scoring ? "Scoring…" : "Submit answer"}
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={handleNext}>
            {index >= total - 1 ? "View results" : "Next question"}
          </Button>
        )}
      </div>
    </div>
  );
}
