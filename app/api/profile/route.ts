import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /api/profile
 * Returns the current user's profile (including saved resume info).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_text, resume_filename, full_name, updated_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    hasResume: Boolean(profile?.resume_text),
    resumeFilename: profile?.resume_filename ?? null,
    fullName: profile?.full_name ?? null,
  });
}
