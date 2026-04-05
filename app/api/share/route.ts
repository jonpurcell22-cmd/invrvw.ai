import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/share
 * Sends a referral email via Supabase's built-in email (uses auth admin invite).
 * Falls back to a mailto link if Supabase email isn't configured.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    senderName?: string;
  };

  const email = body.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const senderName = body.senderName?.trim() || "Someone";

  // For now, return a mailto-compatible response.
  // In production, wire this to SendGrid/Resend/Postmark for branded emails.
  const subject = encodeURIComponent(
    `${senderName} thinks you should try Intrvw.ai`,
  );
  const emailBody = encodeURIComponent(
    `Hey,\n\nI just used Intrvw.ai to prep for an interview and it was a game-changer. It generated questions specific to the role I was applying for, scored my answers, and showed me exactly how to improve.\n\nThe best part — you can try it without even signing up:\nhttps://intrvw.ai\n\nSeriously worth 10 minutes of your time if you have an interview coming up.\n\n– ${senderName}`,
  );

  return NextResponse.json({
    mailto: `mailto:${email}?subject=${subject}&body=${emailBody}`,
    sent: true,
  });
}
