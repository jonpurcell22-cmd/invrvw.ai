import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();

  if (sErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { error: delErr } = await supabase
    .from("responses")
    .delete()
    .eq("session_id", sessionId);

  if (delErr) {
    return NextResponse.json(
      { error: delErr.message ?? "Failed to reset" },
      { status: 500 },
    );
  }

  await supabase
    .from("sessions")
    .update({ overall_score: null, status: "awaiting_answers" })
    .eq("id", sessionId);

  return NextResponse.json({ ok: true });
}
