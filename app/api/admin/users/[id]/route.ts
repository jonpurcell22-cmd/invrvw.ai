import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/users/:id
 *
 * Returns a user's profile and all their sessions with question/response details.
 * Restricted to ADMIN_EMAIL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  // Get user info
  const { data: authData, error: authErr } =
    await admin.auth.admin.getUserById(id);

  if (authErr || !authData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = authData.user;

  // Get all sessions for this user
  const { data: sessions, error: sessErr } = await admin
    .from("sessions")
    .select("id, created_at, company_name, role_title, interview_stage, seniority_level, status, overall_score")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Get question + response counts per session
  const sessionIds = (sessions ?? []).map((s) => s.id);

  let questionCounts = new Map<string, number>();
  let responseCounts = new Map<string, number>();

  if (sessionIds.length > 0) {
    const { data: questions } = await admin
      .from("questions")
      .select("session_id")
      .in("session_id", sessionIds);

    const { data: responses } = await admin
      .from("responses")
      .select("session_id")
      .in("session_id", sessionIds);

    for (const q of questions ?? []) {
      questionCounts.set(q.session_id, (questionCounts.get(q.session_id) ?? 0) + 1);
    }
    for (const r of responses ?? []) {
      responseCounts.set(r.session_id, (responseCounts.get(r.session_id) ?? 0) + 1);
    }
  }

  const enrichedSessions = (sessions ?? []).map((s) => ({
    ...s,
    questionCount: questionCounts.get(s.id) ?? 0,
    responseCount: responseCounts.get(s.id) ?? 0,
  }));

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at ?? null,
    },
    sessions: enrichedSessions,
  });
}
