export const MAX_DOC_BYTES = 8 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_CONTEXT_CHARS = 20_000;
export const DAILY_SESSION_LIMIT = 3;
export const MAX_FEEDBACK_CHARS = 2_000;

export function trimContext(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_CONTEXT_CHARS) return trimmed;
  return trimmed.slice(0, MAX_CONTEXT_CHARS);
}
