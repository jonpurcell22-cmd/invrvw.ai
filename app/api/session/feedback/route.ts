import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/ensure-user";
import { MAX_FEEDBACK_CHARS } from "@/lib/limits";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function clip(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_FEEDBACK_CHARS);
  return trimmed || null;
}

/**
 * POST /api/session/feedback
 * One note per completed session: where they got stuck, what helped, and
 * what they would change.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const user = await ensureUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    stuck?: string;
    useful?: string;
    change?: string;
  };

  const sessionId = body.sessionId?.trim() ?? "";
  const stuck = clip(body.stuck);
  const useful = clip(body.useful);
  const change = clip(body.change);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  if (!stuck && !useful && !change) {
    return NextResponse.json(
      { error: "Answer at least one question." },
      { status: 400 },
    );
  }

  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id, user_id, status")
    .eq("id", sessionId)
    .single();

  if (sessionErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "completed") {
    return NextResponse.json(
      { error: "Finish the session before sending feedback." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("session_feedback").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      stuck,
      useful,
      change,
    },
    { onConflict: "session_id" },
  );

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        { error: "Feedback storage is not set up yet." },
        { status: 503 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
