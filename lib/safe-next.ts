/** Internal path only. Rejects protocol-relative and backslash tricks. */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  if (raw.includes("://")) return fallback;
  return raw;
}
