import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514" as const;

const REQUIRED_DIMENSION_KEYS = [
  "relevance",
  "structure",
  "specificity",
  "impact_articulation",
  "communication_clarity",
  "analytical_reasoning",
  "values_culture_signal",
] as const;

const REQUIRED_DIMENSION_SET = new Set<string>([...REQUIRED_DIMENSION_KEYS]);

const QUESTION_CATEGORIES = [
  "Behavioral",
  "Situational",
  "Technical",
  "Leadership",
  "Culture Fit",
  "Role-Specific",
] as const;

const QUESTION_CATEGORY_SET = new Set<string>([...QUESTION_CATEGORIES]);

export function getAnthropicApiKey(): string {
  const raw = process.env.ANTHROPIC_API_KEY;
  const key = raw?.replace(/^\uFEFF/, "").trim() ?? "";
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to .env.local and restart the dev server.",
    );
  }
  if (key === "your_key" || key === "your_api_key") {
    throw new Error(
      "ANTHROPIC_API_KEY is still a placeholder. Create a key at https://console.anthropic.com/settings/keys and set ANTHROPIC_API_KEY in .env.local.",
    );
  }
  return key;
}

export function createAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: getAnthropicApiKey() });
}

export interface GenerateSessionContentInput {
  resumeText: string;
  jobDescriptionText: string;
  interviewStage: string;
  companyHint?: string;
  roleHint?: string;
}

export interface GeneratedRubricDimension {
  key: string;
  label: string;
  description: string;
  weight: number;
}

export interface GeneratedQuestion {
  question_text: string;
  question_category: string;
  rubric: {
    dimensions: GeneratedRubricDimension[];
    scale_min: number;
    scale_max: number;
    notes?: string;
  };
}

export interface SessionGenerationResult {
  company_name: string;
  role_title: string;
  seniority_level: string;
  company_research_summary: string;
  questions: GeneratedQuestion[];
}

const SESSION_JSON_SYSTEM = `You are Intrvw.ai, an expert interview coach. You produce structured data for a coaching product (not a chatbot).

You have access to web search. Use it to research the employer company inferred from the job description (and resume context): products, market position, culture, recent news, and mission. Summarize findings in company_research_summary (plain text, suitable for storage).

Infer seniority_level as one of: intern, early_career, mid, senior, staff, executive. Base this on the job description and resume. Infer the field/industry from the job description to calibrate scoring appropriately.

Generate between 4 and 6 interview questions tailored to the role, stage, and seniority. At least 1–2 questions must explicitly reference company-specific context from your research (name products, strategy, culture, or recent public information). Distribute question types based on seniority: heavier behavioral weighting for mid and senior levels; more situational questions for early-career candidates. Adjust question difficulty based on interview stage: phone screen questions should filter and qualify; final round questions should test for bar-raising strategic thinking.

question_category must be exactly one of: Behavioral, Situational, Technical, Leadership, Culture Fit, Role-Specific.

For each question, rubric.dimensions must contain exactly seven entries, one per key (in any order):
- relevance — Did they answer what was actually asked?
- structure — STAR or equivalent logical flow (Situation, Task, Action, Result)
- specificity — Concrete, personal, granular examples vs. vague generalities
- impact_articulation — Quantified or clearly qualified outcomes tied to their actions
- communication_clarity — Conciseness, precision of language, narrative efficiency
- analytical_reasoning — Problem-framing, decision logic, root cause thinking
- values_culture_signal — Collaboration, ownership, growth mindset, ethical reasoning

Seniority is NOT a scored dimension. It is a calibration layer that raises or lowers the bar for every other dimension. The same answer that earns a 4 at Early Career may earn a 3 at Senior level.

Each dimension includes key, label, description, and weight. Weights must sum to 1.0 across all 7 dimensions.

Apply seniority-adjusted default weights first:
- Intern/Early Career: Relevance 15-20%, Structure 20%, Communication Clarity 15-20%, Specificity 15%, Analytical Reasoning 10-15%, Impact Articulation 5-10%, Values 10%
- Mid: Even distribution ~15% each, slight emphasis on Specificity and Impact
- Senior/Staff: Impact Articulation 20%, Analytical Reasoning 15%, Values 20%, Structure 10%, Relevance 10%, Specificity 15%, Communication Clarity 10%
- Executive: Values 25%, Impact 20%, Analytical Reasoning 15%, Communication Clarity 15%, Specificity 10%, Relevance 10%, Structure 5%

Then apply question type modifiers:
- Behavioral: Structure +5%, Specificity +5%, Analytical -5%, Values -5%
- Situational: Analytical +10%, Values +5%, Structure -10%, Specificity -5%
- Technical: Analytical +15%, Specificity +10%, Communication +5%, Structure -20%, Values -10%
- Leadership: Values +10%, Impact +5%, Analytical +5%, Structure -10%, Relevance -10%
- Culture Fit: Values +20%, Communication +5%, Structure -15%, Impact -10%
- Role-Specific: Default to Specificity and Analytical as primary signals

Apply interview stage calibration:
- Phone Screen: Emphasize Relevance (25%) and Communication Clarity (25%). 4-5 questions.
- First Round: Standard seniority weights. 5-6 questions.
- Final Round: Impact 20%, Analytical 20%, Values 15%. Bar-raising threshold. 5-6 questions.
- Panel: Same as Final Round, avoid duplicate question types.

Include a notes field in the rubric explaining weight adjustments made and why.

Respond with a single JSON object only. No markdown, no code fences, no preamble or trailing commentary.`;

function buildUserPayload(input: GenerateSessionContentInput): string {
  const hints: string[] = [];
  if (input.companyHint?.trim()) {
    hints.push(`Optional user-provided company hint: ${input.companyHint.trim()}`);
  }
  if (input.roleHint?.trim()) {
    hints.push(`Optional user-provided role title hint: ${input.roleHint.trim()}`);
  }
  const hintBlock =
    hints.length > 0 ? `${hints.join("\n")}\n\n` : "";

  return `${hintBlock}Interview stage selected by the candidate: ${input.interviewStage}

--- RESUME (full text) ---
${input.resumeText}

--- JOB DESCRIPTION (full text) ---
${input.jobDescriptionText}

--- REQUIRED JSON SHAPE (types described; output valid JSON only) ---
{
  "company_name": string,
  "role_title": string,
  "seniority_level": "intern" | "early_career" | "mid" | "senior" | "staff" | "executive",
  "company_research_summary": string,
  "questions": [
    {
      "question_text": string,
      "question_category": "Behavioral" | "Situational" | "Technical" | "Leadership" | "Culture Fit" | "Role-Specific",
      "rubric": {
        "scale_min": 1,
        "scale_max": 5,
        "dimensions": [
          { "key": "relevance", "label": string, "description": string, "weight": number },
          { "key": "structure", "label": string, "description": string, "weight": number },
          { "key": "specificity", "label": string, "description": string, "weight": number },
          { "key": "impact_articulation", "label": string, "description": string, "weight": number },
          { "key": "communication_clarity", "label": string, "description": string, "weight": number },
          { "key": "analytical_reasoning", "label": string, "description": string, "weight": number },
          { "key": "values_culture_signal", "label": string, "description": string, "weight": number }
        ],
        "notes": string (explain weight adjustments)
      }
    }
  ]
}

The questions array must have length 4–6. rubric.dimensions must have exactly 7 objects whose key values are exactly the seven keys listed in the system message. Weights must sum to 1.0.`;
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

function parseJsonFromAssistant(raw: string): unknown {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```\s*$/i, "");
  }
  return JSON.parse(t) as unknown;
}

function normalizeCategory(raw: string): string {
  const t = raw.trim();
  const lower = t.toLowerCase();
  for (const c of QUESTION_CATEGORIES) {
    if (c.toLowerCase() === lower) return c;
  }
  if (lower === "culture fit") return "Culture Fit";
  if (lower === "role-specific" || lower === "role specific") return "Role-Specific";
  return t;
}

export function validateAndNormalizeSessionGeneration(
  data: unknown,
): SessionGenerationResult {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: expected object");
  }
  const o = data as Record<string, unknown>;

  for (const k of [
    "company_name",
    "role_title",
    "seniority_level",
    "company_research_summary",
    "questions",
  ]) {
    if (!(k in o)) {
      throw new Error(`Invalid JSON: missing "${k}"`);
    }
  }

  const company_name = String(o.company_name ?? "").trim();
  const role_title = String(o.role_title ?? "").trim();
  const seniority_level = String(o.seniority_level ?? "").trim();
  const company_research_summary = String(
    o.company_research_summary ?? "",
  ).trim();

  if (!company_name || !role_title || !seniority_level) {
    throw new Error("Invalid JSON: empty company_name, role_title, or seniority_level");
  }

  const questionsRaw = o.questions;
  if (!Array.isArray(questionsRaw)) {
    throw new Error("Invalid JSON: questions must be an array");
  }
  if (questionsRaw.length < 3 || questionsRaw.length > 8) {
    throw new Error(`Invalid JSON: expected 4–6 questions, got ${questionsRaw.length}`);
  }

  const questions: GeneratedQuestion[] = [];

  for (const q of questionsRaw) {
    if (!q || typeof q !== "object") {
      throw new Error("Invalid question entry");
    }
    const qr = q as Record<string, unknown>;
    const question_text = String(qr.question_text ?? "").trim();
    const question_category = normalizeCategory(
      String(qr.question_category ?? ""),
    );
    if (!question_text) {
      throw new Error("Invalid question: empty question_text");
    }
    if (!QUESTION_CATEGORY_SET.has(question_category)) {
      throw new Error(`Invalid question_category: ${question_category}`);
    }

    const rubricRaw = qr.rubric;
    if (!rubricRaw || typeof rubricRaw !== "object") {
      throw new Error("Invalid rubric");
    }
    const rub = rubricRaw as Record<string, unknown>;
    const scale_min = Number(rub.scale_min ?? 1);
    const scale_max = Number(rub.scale_max ?? 5);
    const dimsRaw = rub.dimensions;
    if (!Array.isArray(dimsRaw) || dimsRaw.length !== 7) {
      throw new Error("rubric.dimensions must have exactly 7 entries");
    }

    const keysFound = new Set<string>();
    const dimensions: GeneratedRubricDimension[] = [];
    for (const d of dimsRaw) {
      if (!d || typeof d !== "object") {
        throw new Error("Invalid rubric dimension");
      }
      const dr = d as Record<string, unknown>;
      const key = String(dr.key ?? "").trim();
      const label = String(dr.label ?? "").trim();
      const description = String(dr.description ?? "").trim();
      const weight = Number(dr.weight);
      if (!REQUIRED_DIMENSION_SET.has(key)) {
        throw new Error(`Invalid rubric dimension key: ${key}`);
      }
      if (keysFound.has(key)) {
        throw new Error(`Duplicate rubric dimension key: ${key}`);
      }
      keysFound.add(key);
      if (!label || !description || !Number.isFinite(weight) || weight <= 0) {
        throw new Error(`Invalid rubric dimension values for key ${key}`);
      }
      dimensions.push({ key, label, description, weight });
    }
    for (const req of REQUIRED_DIMENSION_KEYS) {
      if (!keysFound.has(req)) {
        throw new Error(`Missing rubric dimension: ${req}`);
      }
    }

    // Normalize weights to sum to 1.0 in case Claude's math is slightly off
    const weightSum = dimensions.reduce((s, d) => s + d.weight, 0);
    if (weightSum > 0) {
      for (const d of dimensions) {
        d.weight = d.weight / weightSum;
      }
    }

    const notes =
      rub.notes === undefined || rub.notes === null
        ? undefined
        : String(rub.notes);

    questions.push({
      question_text,
      question_category,
      rubric: {
        dimensions,
        scale_min,
        scale_max,
        notes,
      },
    });
  }

  return {
    company_name,
    role_title,
    seniority_level,
    company_research_summary,
    questions,
  };
}

export async function generateSessionInterviewPlan(
  input: GenerateSessionContentInput,
): Promise<SessionGenerationResult> {
  const client = createAnthropicClient();
  const userContent = buildUserPayload(input);

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16384,
    temperature: 0.3,
    system: SESSION_JSON_SYSTEM,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  if (message.stop_reason === "pause_turn") {
    throw new Error(
      "Claude stopped with pause_turn; try again or adjust max_tokens.",
    );
  }

  const rawText = extractAssistantText(message);
  if (!rawText) {
    throw new Error("Empty response from Claude");
  }

  const parsed = parseJsonFromAssistant(rawText);
  return validateAndNormalizeSessionGeneration(parsed);
}
