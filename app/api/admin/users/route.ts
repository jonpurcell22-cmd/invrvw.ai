import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/users
 *
 * Lists all users with their session counts and most recent activity.
 * Restricted to ADMIN_EMAIL.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = createSupabaseAdminClient();

  // Fetch all auth users
  const { data: authData, error: authErr } =
    await admin.auth.admin.listUsers({ perPage: 1000 });

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const users = authData.users;

  // Fetch all sessions (just the fields we need for aggregation)
  const { data: sessions, error: sessErr } = await admin
    .from("sessions")
    .select("id, user_id, status, overall_score, company_name, role_title, created_at")
    .order("created_at", { ascending: false });

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Group sessions by user
  const sessionsByUser = new Map<string, typeof sessions>();
  for (const s of sessions ?? []) {
    const arr = sessionsByUser.get(s.user_id) ?? [];
    arr.push(s);
    sessionsByUser.set(s.user_id, arr);
  }

  const result = users.map((u) => {
    const userSessions = sessionsByUser.get(u.id) ?? [];
    const completed = userSessions.filter((s) => s.status === "completed").length;
    const latestSession = userSessions[0] ?? null;

    return {
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      sessionCount: userSessions.length,
      completedCount: completed,
      latestSession: latestSession
        ? {
            companyName: latestSession.company_name,
            roleTitle: latestSession.role_title,
            status: latestSession.status,
            createdAt: latestSession.created_at,
          }
        : null,
    };
  });

  // Sort by most recent activity (latest session or sign-in)
  result.sort((a, b) => {
    const aDate = a.latestSession?.createdAt ?? a.lastSignIn ?? a.createdAt;
    const bDate = b.latestSession?.createdAt ?? b.lastSignIn ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return NextResponse.json({ users: result });
}
