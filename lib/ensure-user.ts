import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the signed-in account. Anonymous sessions are treated as logged out
 * so practice, scoring, and uploads require a real account.
 */
export async function ensureUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) return null;
  return user;
}
