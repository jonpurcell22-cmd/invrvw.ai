import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_MESSAGE = "That link can't be fetched. Paste the text instead.";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  ) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  if (lower.includes(":")) {
    if (lower === "::1" || lower === "::") return true;
    if (
      lower.startsWith("fe80:") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd")
    ) {
      return true;
    }
    return false;
  }
  return isPrivateIpv4(lower);
}

export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(BLOCKED_MESSAGE);
  }

  if (url.protocol !== "https:") throw new Error(BLOCKED_MESSAGE);
  if (url.username || url.password) throw new Error(BLOCKED_MESSAGE);

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    /^\d+$/.test(host)
  ) {
    throw new Error(BLOCKED_MESSAGE);
  }

  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error(BLOCKED_MESSAGE);
    return url;
  }

  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error(BLOCKED_MESSAGE);
  }
  if (records.length === 0 || records.some((r) => isPrivateAddress(r.address))) {
    throw new Error(BLOCKED_MESSAGE);
  }
  return url;
}

/** Fetch an https URL and re-check every redirect so it cannot bounce inward. */
export async function fetchPublicHttps(
  raw: string,
  init?: RequestInit,
): Promise<Response> {
  let current = await assertPublicHttpsUrl(raw);
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(current, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(BLOCKED_MESSAGE);
      current = await assertPublicHttpsUrl(new URL(location, current).toString());
      continue;
    }
    return res;
  }
  throw new Error(BLOCKED_MESSAGE);
}
