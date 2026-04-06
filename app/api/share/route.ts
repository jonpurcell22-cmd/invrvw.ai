import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/share
 * Sends a branded referral email via Resend.
 * Falls back to mailto if RESEND_API_KEY is not configured.
 */
export async function POST(request: Request) {
  // Rate limit: 10 shares per hour per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(ip, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many invites sent. Try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    email?: string;
    senderName?: string;
  };

  const email = body.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const senderName = body.senderName?.trim() || "A friend";
  const apiKey = process.env.RESEND_API_KEY?.trim();

  // If Resend is configured, send a real email
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Intrvw.ai <invite@intrvw.ai>",
        to: email,
        subject: `${senderName} thinks you should try Intrvw.ai before your next interview`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; color: #1e1b4b;">
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey,</p>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
    ${senderName} just used <strong>Intrvw.ai</strong> to prep for an interview and wanted to pass it along.
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
    It generates interview questions specific to your resume and the job you're applying for,
    records your spoken answers, and shows you exactly how to improve — with a stronger version
    of your answer built from your actual experience.
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
    You can try it without signing up. Seriously worth 10 minutes if you have an interview coming up.
  </p>

  <a href="https://intrvw.ai" style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
    Start practicing free
  </a>

  <p style="font-size: 13px; color: #8b8b98; margin-top: 32px; line-height: 1.5;">
    This invite was sent by ${senderName} via
    <a href="https://intrvw.ai" style="color: #3B82F6; text-decoration: none;">Intrvw.ai</a>
  </p>
</div>
        `.trim(),
      });

      return NextResponse.json({ sent: true });
    } catch (e) {
      console.error("Resend error:", e);
      // Fall through to mailto fallback
    }
  }

  // Fallback: return mailto link
  const subject = encodeURIComponent(
    `${senderName} thinks you should try Intrvw.ai`,
  );
  const emailBody = encodeURIComponent(
    `Hey,\n\nI just used Intrvw.ai to prep for an interview and it was a game-changer. It generated questions specific to the role I was applying for, scored my answers, and showed me exactly how to improve.\n\nThe best part — you can try it without even signing up:\nhttps://intrvw.ai\n\nSeriously worth 10 minutes of your time if you have an interview coming up.\n\n– ${senderName}`,
  );

  return NextResponse.json({
    mailto: `mailto:${email}?subject=${subject}&body=${emailBody}`,
    sent: false,
  });
}
