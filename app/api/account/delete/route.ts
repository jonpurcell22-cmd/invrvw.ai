import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/ensure-user";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function missingTable(message: string | undefined): boolean {
  if (!message) return false;
  return /does not exist|schema cache/i.test(message);
}

/**
 * Deletes the signed-in account and the resume, sessions, and answers
 * stored under it.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const user = await ensureUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: sessions, error: sessionErr } = await admin
      .from("sessions")
      .select("id")
      .eq("user_id", user.id);

    if (sessionErr) {
      return NextResponse.json({ error: sessionErr.message }, { status: 500 });
    }

    const ids = (sessions ?? []).map((row) => row.id);
    if (ids.length > 0) {
      const feedback = await admin
        .from("session_feedback")
        .delete()
        .in("session_id", ids);
      if (feedback.error && !missingTable(feedback.error.message)) {
        return NextResponse.json(
          { error: feedback.error.message },
          { status: 500 },
        );
      }

      const responses = await admin.from("responses").delete().in("session_id", ids);
      if (responses.error) {
        return NextResponse.json({ error: responses.error.message }, { status: 500 });
      }
      const questions = await admin.from("questions").delete().in("session_id", ids);
      if (questions.error) {
        return NextResponse.json({ error: questions.error.message }, { status: 500 });
      }
      const removed = await admin.from("sessions").delete().in("id", ids);
      if (removed.error) {
        return NextResponse.json({ error: removed.error.message }, { status: 500 });
      }
    }

    const profile = await admin.from("profiles").delete().eq("id", user.id);
    if (profile.error && !missingTable(profile.error.message)) {
      return NextResponse.json({ error: profile.error.message }, { status: 500 });
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
