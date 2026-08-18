import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

/**
 * POST /api/email/welcome
 * Sends a welcome email to a new user after registration.
 * Falls back silently if RESEND_API_KEY is not set.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    resultsUrl?: string;
  };

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const name = body.name?.trim() || null;
  const resultsUrl = body.resultsUrl?.trim() || null;
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    // No Resend key — skip silently
    return NextResponse.json({ sent: false, reason: "no_api_key" });
  }

  try {
    const resend = new Resend(apiKey);

    const greeting = name ? `Hey ${name},` : "Hey,";
    const resultsBlock = resultsUrl
      ? `
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
    Your interview results are ready. Here's the personalized coaching report:
  </p>
  <a href="https://intrvw.ai${resultsUrl}" style="display: inline-block; background: #ffffff; color: #0a0619; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
    View your results
  </a>
  <br><br>`
      : "";

    await resend.emails.send({
      from: "Intrvw.ai <hello@intrvw.ai>",
      to: email,
      subject: name
        ? `Welcome to Intrvw.ai, ${name}`
        : "Welcome to Intrvw.ai",
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; color: #EDEDF0; background: #0a0619; padding: 32px; border-radius: 12px;">
  <img src="https://intrvw.ai/logo.svg" alt="Intrvw.ai" width="120" style="margin-bottom: 24px;" />

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${greeting}</p>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
    Welcome to Intrvw.ai — the only interview coach that knows your story.
  </p>

  ${resultsBlock}

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
    Here's how to get the most out of it:
  </p>

  <ul style="font-size: 15px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px; color: #9994B0;">
    <li><strong style="color: #EDEDF0;">Practice out loud</strong> — speaking your answers is fundamentally different from thinking them</li>
    <li><strong style="color: #EDEDF0;">Read the stronger versions</strong> — they're built from your actual background, not templates</li>
    <li><strong style="color: #EDEDF0;">Focus on one thing at a time</strong> — each coaching report tells you the single highest-leverage fix</li>
    <li><strong style="color: #EDEDF0;">Practice more than once</strong> — your scores compound across sessions</li>
  </ul>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
    The difference between a good interview and a great one can be tens of thousands of dollars. You're investing in yourself — that matters.
  </p>

  <a href="https://intrvw.ai/session/new" style="display: inline-block; background: #ffffff; color: #0a0619; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
    Start a new practice session
  </a>

  <p style="font-size: 13px; color: #5E5878; margin-top: 32px; line-height: 1.5;">
    You're receiving this because you created an account at
    <a href="https://intrvw.ai" style="color: #f2203e; text-decoration: none;">intrvw.ai</a>.
  </p>
</div>
      `.trim(),
    });

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("Welcome email error:", e);
    return NextResponse.json({ sent: false, reason: "send_failed" });
  }
}
