import { NextResponse } from "next/server";
import { createAnthropicClient, CLAUDE_MODEL } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/extract-jd-meta
 * Quick extraction of company name and role title from job description text.
 * Uses a fast, cheap Claude call.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();

  if (!text || text.length < 20) {
    return NextResponse.json({ company: null, role: null });
  }

  try {
    const client = createAnthropicClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      temperature: 0,
      system:
        'Extract the company name and role title from this job description. Respond with JSON only: {"company": string | null, "role": string | null}. If either is not identifiable, use null.',
      messages: [
        { role: "user", content: text.slice(0, 3000) },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();

    let parsed: { company?: string | null; role?: string | null } = {};
    try {
      let cleaned = raw;
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/i, "");
      }
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json({ company: null, role: null });
    }

    return NextResponse.json({
      company: parsed.company ?? null,
      role: parsed.role ?? null,
    });
  } catch {
    return NextResponse.json({ company: null, role: null });
  }
}
