import { createAnthropicClient, CLAUDE_MODEL } from "@/lib/claude";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

export interface SummaryInput {
  companyName: string | null;
  roleTitle: string | null;
  seniorityLevel: string | null;
  interviewStage: string | null;
  overallScore: number;
  questions: {
    questionText: string;
    category: string;
    transcript: string;
    score: number;
    feedback: string | null;
  }[];
}

function extractAssistantText(message: Message): string {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJsonLoose(raw: string): unknown {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return JSON.parse(t) as unknown;
}

export async function generateSessionSummary(
  input: SummaryInput,
): Promise<string> {
  const client = createAnthropicClient();

  const system = `You are Intrvw.ai, an expert interview coach. You are analyzing a completed mock interview session to identify cross-cutting patterns and trends.

Your job is to produce a concise, honest, actionable session summary. You are looking for PATTERNS — things that appear across multiple answers, not one-off issues (those are handled in per-question feedback).

WHAT TO LOOK FOR:

Verbal patterns:
- Filler words (um, uh, like, you know, sort of, kind of) — estimate frequency relative to normal speech
- Hedging language (I think maybe, I guess, sort of) — does it undermine confidence?
- "We" vs "I" — does the candidate consistently hide behind team credit?
- Trailing off — do answers tend to fade out instead of closing strong?
- Answer length — are they consistently too brief (under 30 seconds) or too long (over 4 minutes)?

Structural patterns:
- Missing STAR elements — which ones are consistently weak or absent?
- Situation over-indexing — do they spend too long setting context?
- Missing reflections — do they ever close with a lesson learned?
- Missing results — do they describe what they did but not what happened?

Dimension trends:
- Which dimensions are consistently strong across questions?
- Which dimensions are consistently weak?
- Is there a pattern by question type? (e.g., strong on behavioral, weak on situational)

Content patterns:
- Do they quantify outcomes or leave them vague?
- Do they connect experiences to the target role?
- Do they demonstrate seniority-appropriate scope?

OUTPUT FORMAT:
Return a JSON object with this shape:
{
  "strengths": ["pattern 1", "pattern 2"],
  "improvements": ["pattern 1", "pattern 2", "pattern 3"],
  "headline": "one sentence overall assessment"
}

Rules:
- 2-3 strengths, 2-4 improvements
- Each item is 1-2 sentences, specific and behavioral
- Reference specific moments across answers where possible ("In 3 of your 8 answers, you...")
- Use warm, coaching language — not clinical or harsh
- strengths must be real patterns, not generic praise
- improvements must be actionable — tell them what to DO differently
- headline should be honest and encouraging, calibrated to their score
- Do not repeat per-question feedback — only cross-cutting patterns
- If someone scored very well (80+), focus improvements on polish and refinement
- If someone scored poorly (<40), focus on 2 foundational habits, not everything at once

Respond with JSON only.`;

  const questionsBlock = input.questions
    .map((q, i) => {
      const feedbackDims = q.feedback
        ? (() => {
            try {
              const parsed = JSON.parse(q.feedback) as {
                dimensions?: Record<string, { score: number; feedback: string }>;
              };
              if (!parsed.dimensions) return "";
              return Object.entries(parsed.dimensions)
                .map(([k, v]) => `  ${k}: ${v.score}/5`)
                .join("\n");
            } catch {
              return "";
            }
          })()
        : "";

      return `--- Question ${i + 1} (${q.category}, score: ${q.score}/100) ---
${q.questionText}

Transcript:
${q.transcript}
${feedbackDims ? `\nDimension scores:\n${feedbackDims}` : ""}`;
    })
    .join("\n\n");

  const user = `Session context:
- Company: ${input.companyName ?? "Unknown"}
- Role: ${input.roleTitle ?? "Unknown"}
- Seniority: ${input.seniorityLevel ?? "Unknown"}
- Stage: ${input.interviewStage ?? "Unknown"}
- Overall score: ${input.overallScore}/100

${questionsBlock}`;

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: user }],
  });

  const raw = extractAssistantText(message);
  if (!raw) throw new Error("Empty summary response");

  // Validate JSON shape
  const parsed = parseJsonLoose(raw) as Record<string, unknown>;
  const strengths = parsed.strengths;
  const improvements = parsed.improvements;
  const headline = parsed.headline;

  if (
    !Array.isArray(strengths) ||
    !Array.isArray(improvements) ||
    typeof headline !== "string"
  ) {
    throw new Error("Invalid summary JSON shape");
  }

  return JSON.stringify({ strengths, improvements, headline });
}
