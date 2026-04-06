/**
 * Client-side delivery analysis from transcript and speech metadata.
 * Detects filler words, rates pacing, and evaluates answer length.
 */

const FILLER_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\blike\b(?!\s+(?:a|the|to|it|this|that|when|how|what))/gi,
  /\byou know\b/gi,
  /\bsort of\b/gi,
  /\bkind of\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi,
  /\bi mean\b/gi,
  /\bso+\b(?=\s*,|\s*\.|\s+(?:um|uh|like|yeah))/gi,
  /\bright\?/gi,
  /\byeah\b/gi,
];

export type FillerMatch = {
  word: string;
  count: number;
};

export type DeliveryAnalysis = {
  /** Total filler word count */
  fillerCount: number;
  /** Breakdown by filler word */
  fillerBreakdown: FillerMatch[];
  /** Fillers per minute of speech */
  fillersPerMinute: number | null;
  /** Speaking pace in words per minute */
  wordsPerMinute: number | null;
  /** Pace rating */
  paceRating: "too_slow" | "good" | "too_fast" | null;
  /** Answer duration in seconds */
  durationSec: number | null;
  /** Duration rating */
  durationRating: "too_short" | "good" | "too_long" | null;
  /** Total word count */
  wordCount: number;
};

export function analyzeDelivery(
  transcript: string,
  speechMeta?: {
    durationSec?: number | null;
    wordCount?: number | null;
    wordsPerMinute?: number | null;
  } | null,
): DeliveryAnalysis {
  const text = transcript.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const durationSec = speechMeta?.durationSec ?? null;

  // Filler word detection
  const fillerMap = new Map<string, number>();
  for (const pattern of FILLER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const normalized = m.toLowerCase().trim();
        fillerMap.set(normalized, (fillerMap.get(normalized) ?? 0) + 1);
      }
    }
  }

  const fillerBreakdown = Array.from(fillerMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const fillerCount = fillerBreakdown.reduce((s, f) => s + f.count, 0);

  // Speaking pace
  const wordsPerMinute =
    speechMeta?.wordsPerMinute ??
    (durationSec && durationSec > 0
      ? Math.round((wordCount / durationSec) * 60)
      : null);

  let paceRating: DeliveryAnalysis["paceRating"] = null;
  if (wordsPerMinute !== null) {
    if (wordsPerMinute < 100) paceRating = "too_slow";
    else if (wordsPerMinute > 170) paceRating = "too_fast";
    else paceRating = "good";
  }

  // Duration rating (ideal interview answer: 60-180 seconds)
  let durationRating: DeliveryAnalysis["durationRating"] = null;
  if (durationSec !== null) {
    if (durationSec < 30) durationRating = "too_short";
    else if (durationSec > 240) durationRating = "too_long";
    else durationRating = "good";
  }

  // Fillers per minute
  const fillersPerMinute =
    durationSec && durationSec > 0
      ? Math.round((fillerCount / durationSec) * 60 * 10) / 10
      : null;

  return {
    fillerCount,
    fillerBreakdown,
    fillersPerMinute,
    wordsPerMinute,
    paceRating,
    durationSec,
    durationRating,
    wordCount,
  };
}
