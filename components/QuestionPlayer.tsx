import type { Question } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { FileUpload } from "@/components/FileUpload";

export interface QuestionPlayerProps {
  question: Question;
  currentIndex: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
  /** Wired in session practice flow; defaults to no-op for legacy demos. */
  onTranscript?: (text: string) => void;
}

export function QuestionPlayer({
  question,
  currentIndex,
  total,
  onPrevious,
  onNext,
  onTranscript = () => {},
}: QuestionPlayerProps) {
  const prev = onPrevious ?? (() => {});
  const next = onNext ?? (() => {});
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">
          Question {currentIndex + 1} of {total}
        </Badge>
        <Badge tone="neutral">{question.questionCategory}</Badge>
      </div>

      <div className="animate-fade-up">
        <h1 className="text-xl font-bold tracking-tight text-[var(--fg)] sm:text-2xl">
          {question.questionText}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          Answer with voice or upload a memo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VoiceRecorder onTranscript={onTranscript} />
        <FileUpload
          label="Voice memo"
          description="MP3, M4A, WAV, or WebM — use session practice for full flow."
          accept="audio/*"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6">
        <Button
          type="button"
          variant="secondary"
          disabled={currentIndex <= 0}
          onClick={prev}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost">
            Save draft
          </Button>
          <Button type="button" variant="primary" onClick={next}>
            Next question
          </Button>
        </div>
      </div>
    </div>
  );
}
