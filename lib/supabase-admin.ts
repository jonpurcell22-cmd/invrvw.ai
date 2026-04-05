import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase";

/**
 * Server-only Supabase client with service role key — bypasses RLS.
 * Use only in API routes / server actions, never expose to the browser.
 */
export function createSupabaseAdminClient() {
  const url = normalizeSupabaseProjectUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (Supabase → Project Settings → API Keys → service_role).",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
