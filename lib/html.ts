export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Single-line label safe to drop into an email subject or greeting. */
export function plainLabel(value: string | null | undefined, fallback: string): string {
  const cleaned = (value ?? "")
    .replace(/[\r\n<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}
