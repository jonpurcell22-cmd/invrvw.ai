import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/extract-url
 * Fetches a URL and extracts the main text content.
 * Handles regular web pages and Google Docs links.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string };
  const rawUrl = body.url?.trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let fetchUrl = rawUrl;

  // Handle Google Docs links — convert to plain text export
  const gdocMatch = rawUrl.match(
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (gdocMatch) {
    fetchUrl = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,text/plain,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 400 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    // If it's plain text (Google Docs export), return directly
    if (contentType.includes("text/plain")) {
      const text = raw.trim();
      if (!text) {
        return NextResponse.json(
          { error: "URL returned empty content" },
          { status: 400 },
        );
      }
      return NextResponse.json({ text });
    }

    // Parse HTML and extract text
    const $ = cheerio.load(raw);

    // Remove scripts, styles, nav, footer, header
    $(
      "script, style, nav, footer, header, iframe, noscript, [role=navigation], [role=banner]",
    ).remove();

    // Try to find the main content area
    const mainSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".job-description",
      ".posting-page",
      ".job-content",
      "#job-description",
      ".description",
    ];

    let text = "";
    for (const sel of mainSelectors) {
      const el = $(sel);
      if (el.length) {
        text = el.text().trim();
        if (text.length > 100) break;
      }
    }

    // Fall back to body text
    if (text.length < 100) {
      text = $("body").text().trim();
    }

    // Clean up whitespace
    text = text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (!text || text.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract meaningful text from this URL. Try pasting the job description directly.",
        },
        { status: 400 },
      );
    }

    // Truncate if extremely long
    if (text.length > 20000) {
      text = text.slice(0, 20000);
    }

    return NextResponse.json({ text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch URL";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
