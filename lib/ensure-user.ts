import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures there's a user session — either real or anonymous.
 * Returns the user, creating an anonymous session if needed.
 */
export async function ensureUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user;

  // No session — create anonymous one
  const { data: anonData, error: anonError } =
    await supabase.auth.signInAnonymously();

  if (anonError || !anonData?.user) {
    return null;
  }

  return anonData.user;
}
