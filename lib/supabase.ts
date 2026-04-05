import { createBrowserClient } from "@supabase/ssr";

function stripEnvValue(raw: string | undefined): string {
  if (raw == null) return "";
  return raw.replace(/^\uFEFF/, "").trim();
}

/**
 * Normalizes Supabase project URL: trims, adds https:// if omitted, validates.
 */
export function normalizeSupabaseProjectUrl(raw: string | undefined): string {
  let url = stripEnvValue(raw);
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing or empty. Add it to .env.local (Supabase → Project Settings → Data API → Project URL). Example: https://xxxxx.supabase.co",
    );
  }

  const lower = url.toLowerCase();
  if (lower === "your_url") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is still a placeholder. Replace it with your real Project URL from the Supabase dashboard.",
    );
  }

  if (!/^https?:\/\//i.test(url)) {
    if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(url)) {
      url = `https://${url}`;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Check .env.local for typos or smart quotes. Current value starts with: ${JSON.stringify(url.slice(0, 48))}`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use http:// or https:// (use https:// for Supabase).",
    );
  }

  return `${parsed.protocol}//${parsed.host}`;
}

/**
 * Browser client + env for Client Components (no `next/headers`).
 * Server: `createSupabaseServerClient` in `lib/supabase-server.ts`.
 */
export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const anonKey = stripEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!anonKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (Supabase → Project Settings → API Keys).",
    );
  }
  if (anonKey === "your_anon_key") {
    throw new Error(
      "Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with your real anon or publishable key from Supabase.",
    );
  }

  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  return { url, anonKey };
}

/** For middleware: invalid or missing env → null (no throw). */
export function tryGetSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  try {
    return getSupabasePublicConfig();
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[supabase]",
        e instanceof Error ? e.message : e,
      );
    }
    return null;
  }
}

/** Client Components — singleton browser client (cookie session). */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserClient(url, anonKey);
}
