"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type { AudioRecording } from "@/lib/audio";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2 } from "lucide-react";

export type PracticeQuestionRow = {
  id: string;
  question_text: string;
  question_category: string;
  question_order: number;
};

type SavedAnswer = {
  questionId: string;
  transcript: string;
  speechMeta: {
    durationSec: number | null;
    wordCount: number;
    wordsPerMinute: number | null;
  };
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
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<AudioRecording | null>(null);

  const current = questions[index];
  const total = questions.length;
  const isLastQuestion = index >= total - 1;
  const hasTranscript = transcript.trim().length > 0;

  // Check if current question already has a saved answer
  const currentSaved = answers.find((a) => a.questionId === current?.id);

  if (!current) {
    return (
      <p className="text-sm text-[var(--fg-muted)]">No questions in session.</p>
    );
  }

  function saveCurrentAnswer() {
    const t = transcript.trim();
    if (!t) return null;

    const wordCount = t.split(/\s+/).filter(Boolean).length;
    const durationSec = audioRef.current?.durationSec ?? null;
    const wordsPerMinute =
      durationSec && durationSec > 0
        ? Math.round((wordCount / durationSec) * 60)
        : null;

    const answer: SavedAnswer = {
      questionId: current.id,
      transcript: t,
      speechMeta: {
        durationSec: durationSec ? Math.round(durationSec) : null,
        wordCount,
        wordsPerMinute,
      },
    };

    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== current.id);
      return [...filtered, answer];
    });

    return answer;
  }

  function handleNext() {
    saveCurrentAnswer();
    setIndex((i) => i + 1);
    setTranscript("");
    setError(null);
    audioRef.current = null;
  }

  function handlePrev() {
    saveCurrentAnswer();
    setIndex((i) => Math.max(0, i - 1));
    // Restore previous transcript
    const prevQuestion = questions[index - 1];
    if (prevQuestion) {
      const prevAnswer = answers.find(
        (a) => a.questionId === prevQuestion.id,
      );
      setTranscript(prevAnswer?.transcript ?? "");
    }
    setError(null);
    audioRef.current = null;
  }

  async function handleFinish() {
    const finalAnswer = saveCurrentAnswer();
    if (!finalAnswer && !currentSaved) return;

    // Collect all answers
    const allAnswers = [...answers.filter((a) => a.questionId !== current.id)];
    if (finalAnswer) allAnswers.push(finalAnswer);
    else if (currentSaved) allAnswers.push(currentSaved);

    // Verify we have answers for all questions
    const answeredIds = new Set(allAnswers.map((a) => a.questionId));
    const unanswered = questions.filter((q) => !answeredIds.has(q.id));
    if (unanswered.length > 0) {
      setError(
        `${unanswered.length} question${unanswered.length > 1 ? "s" : ""} still need an answer.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/session/submit-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers: allAnswers,
        }),
      });
      const data = (await res.json()) as {
        resultsUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Scoring failed");
      }
      router.push(data.resultsUrl ?? `/session/${sessionId}/results`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  // Restore transcript when navigating back to an answered question
  const displayTranscript =
    transcript || answers.find((a) => a.questionId === current.id)?.transcript || "";

  // Scoring screen
  if (submitting) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2
          size={32}
          className="animate-spin text-[var(--accent)]"
        />
        <h2 className="mt-6 text-xl font-bold text-[var(--fg)]">
          Scoring your interview
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--fg-muted)]">
          We're analyzing all {total} answers in parallel — scoring each on 7
          dimensions and generating personalized coaching. This usually takes
          about a minute.
        </p>
        <div className="mt-8 w-full max-w-xs">
          <ProgressBar value={100} max={100} />
        </div>
      </div>
    );
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
        {currentSaved ? (
          <Badge tone="success">Answered</Badge>
        ) : null}
      </div>

      <div key={current.id} className="animate-fade-up">
        <h1 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
          {current.question_text}
        </h1>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Record your answer using the microphone, then move to the next
          question. All answers are scored together at the end.
        </p>
      </div>

      <VoiceRecorder
        key={current.id}
        onTranscript={(t) => setTranscript(t)}
        onAudioRecording={(rec) => {
          audioRef.current = rec;
        }}
      />

      <div className="space-y-2">
        <label
          htmlFor="transcript"
          className="block text-sm font-medium text-[var(--fg-muted)]"
        >
          Your answer
        </label>
        <textarea
          id="transcript"
          value={displayTranscript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder="Your answer appears here after recording — or type it directly."
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--fg)] shadow-sm transition-colors placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        />
      </div>

      {error ? (
        <div
          className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-muted)] px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={handlePrev}
        >
          Previous
        </Button>
        <div className="flex gap-3">
          {/* Dev-only: skip to scoring with dummy answers */}
          {process.env.NODE_ENV === "development" ? (
            <Button
              variant="ghost"
              onClick={() => {
                const dummyAnswers: SavedAnswer[] = questions.map((q) => ({
                  questionId: q.id,
                  transcript:
                    "At my previous company I led a migration of our core payment system from a monolithic architecture to microservices. I started by mapping all service boundaries with the engineering team, then created a phased rollout plan. We moved the auth service first since it had the fewest dependencies. Over six months we migrated eight services, reduced deploy times from 45 minutes to under 5, and cut incident rates by 60 percent. The key lesson was investing upfront in shared observability tooling before splitting services.",
                  speechMeta: {
                    durationSec: 90,
                    wordCount: 85,
                    wordsPerMinute: 140,
                  },
                }));
                setAnswers(dummyAnswers);
                setSubmitting(true);
                setError(null);
                fetch("/api/session/submit-all", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ sessionId, answers: dummyAnswers }),
                })
                  .then((r) => r.json())
                  .then((data: { resultsUrl?: string; error?: string }) => {
                    if (data.error) throw new Error(data.error);
                    router.push(
                      data.resultsUrl ?? `/session/${sessionId}/results`,
                    );
                    router.refresh();
                  })
                  .catch((e: Error) => {
                    setError(e.message);
                    setSubmitting(false);
                  });
              }}
            >
              Dev: Skip to scoring
            </Button>
          ) : null}
          {!isLastQuestion ? (
            <Button
              variant="primary"
              disabled={!hasTranscript && !currentSaved}
              onClick={handleNext}
            >
              Next question
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!hasTranscript && !currentSaved}
              onClick={handleFinish}
            >
              Finish & get results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
