import Anthropic from "@anthropic-ai/sdk";
import type { Message, MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const CLAUDE_MODEL = "claude-opus-5" as const;

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

// Opus 5 runs adaptive thinking by default, so thinking tokens draw down the
// same max_tokens budget as the JSON payload. A full plan costs ~10k output
// tokens (~2k of it thinking), so the old 16384 cap could be exhausted
// mid-array; the truncated JSON then failed to parse with an opaque
// "Expected ',' or ']'" SyntaxError. Stream the request so the larger budget
// can't run into an HTTP timeout.
const MAX_PLAN_OUTPUT_TOKENS = 32000;

// Truncation is not a parse problem, so don't let it surface as one.
export function assertNotTruncated(message: Message, label: string): void {
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      `${label} hit the output token limit before finishing. Please try again.`,
    );
  }
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

// Scan for the first balanced { ... } run, tracking string state so braces
// inside values don't throw the count off. The previous lastIndexOf("}")
// approach picked up any stray brace in trailing prose and produced an
// unbalanced slice, which then failed to parse for a misleading reason.
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
  }

  return null;
}

// Claude occasionally leaves a comma before a closing brace or bracket, which
// is valid in JS but not JSON. Drop those, ignoring commas inside strings.
function stripTrailingCommas(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === ",") {
      let j = i + 1;
      while (j < json.length && /\s/.test(json[j])) j++;
      if (json[j] === "}" || json[j] === "]") continue;
    }

    out += ch;
  }

  return out;
}

export function parseJsonFromAssistant(raw: string): unknown {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```\s*$/i, "");
    t = t.trim();
  }

  try {
    return JSON.parse(t) as unknown;
  } catch {
    // Fall through — Claude sometimes wraps the object in prose.
  }

  // Claude sometimes adds a short preamble before the JSON object.
  const candidate = extractJsonObject(t);
  if (!candidate) {
    throw new Error("Could not find a JSON object in Claude's response");
  }

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // Fall through — try the repair pass before giving up.
  }

  try {
    return JSON.parse(stripTrailingCommas(candidate)) as unknown;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(`Claude returned malformed JSON: ${detail}`);
  }
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

// Canonical dimension copy, mirroring the seven dimensions defined in
// SESSION_JSON_SYSTEM. Used to fill a gap when Claude omits one.
const DIMENSION_DEFAULTS: Record<
  string,
  { label: string; description: string }
> = {
  relevance: {
    label: "Relevance",
    description: "Did they answer what was actually asked?",
  },
  structure: {
    label: "Structure",
    description:
      "STAR or equivalent logical flow (Situation, Task, Action, Result)",
  },
  specificity: {
    label: "Specificity",
    description:
      "Concrete, personal, granular examples vs. vague generalities",
  },
  impact_articulation: {
    label: "Impact Articulation",
    description:
      "Quantified or clearly qualified outcomes tied to their actions",
  },
  communication_clarity: {
    label: "Communication Clarity",
    description: "Conciseness, precision of language, narrative efficiency",
  },
  analytical_reasoning: {
    label: "Analytical Reasoning",
    description: "Problem-framing, decision logic, root cause thinking",
  },
  values_culture_signal: {
    label: "Values / Culture Signal",
    description: "Collaboration, ownership, growth mindset, ethical reasoning",
  },
};

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
    if (!Array.isArray(dimsRaw)) {
      throw new Error("rubric.dimensions must be an array");
    }

    // Claude intermittently drops, duplicates, or mangles one of the seven
    // dimensions. Index whatever it sent and rebuild the canonical set, rather
    // than discarding an otherwise good plan over one bad entry.
    const suppliedDims = new Map<
      string,
      { label: string; description: string; weight: number }
    >();
    for (const d of dimsRaw) {
      if (!d || typeof d !== "object") continue;
      const dr = d as Record<string, unknown>;
      const key = String(dr.key ?? "").trim();
      if (!REQUIRED_DIMENSION_SET.has(key) || suppliedDims.has(key)) continue;
      const weight = Number(dr.weight);
      suppliedDims.set(key, {
        label: String(dr.label ?? "").trim(),
        description: String(dr.description ?? "").trim(),
        weight: Number.isFinite(weight) && weight > 0 ? weight : 0,
      });
    }

    const dimensions: GeneratedRubricDimension[] = REQUIRED_DIMENSION_KEYS.map(
      (key) => {
        const supplied = suppliedDims.get(key);
        const fallback = DIMENSION_DEFAULTS[key];
        return {
          key,
          label: supplied?.label || fallback.label,
          description: supplied?.description || fallback.description,
          weight: supplied?.weight ?? 0,
        };
      },
    );

    // A dimension we had to fill in still has to count for something, so give
    // it the average of the weights Claude did supply before normalizing.
    const weighted = dimensions.filter((d) => d.weight > 0);
    const fallbackWeight =
      weighted.length > 0
        ? weighted.reduce((sum, d) => sum + d.weight, 0) / weighted.length
        : 1 / dimensions.length;
    for (const d of dimensions) {
      if (d.weight <= 0) d.weight = fallbackWeight;
    }

    // Normalize weights to sum to 1.0 in case Claude's math is slightly off
    const weightSum = dimensions.reduce((s, d) => s + d.weight, 0);
    for (const d of dimensions) {
      d.weight = d.weight / weightSum;
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

async function requestSessionPlan(
  client: Anthropic,
  userContent: string,
): Promise<SessionGenerationResult> {
  const tools = [
    {
      type: "web_search_20250305" as const,
      name: "web_search" as const,
      max_uses: 5,
    },
  ];

  const messages: MessageParam[] = [
    { role: "user", content: userContent },
  ];

  let message: Message | undefined;
  for (let turn = 0; turn < 8; turn++) {
    message = await client.messages
      .stream({
        model: CLAUDE_MODEL,
        max_tokens: MAX_PLAN_OUTPUT_TOKENS,
        system: SESSION_JSON_SYSTEM,
        tools,
        messages,
      })
      .finalMessage();

    if (message.stop_reason === "end_turn") {
      break;
    }

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }

    break;
  }

  if (!message) {
    throw new Error("No response from Claude");
  }

  assertNotTruncated(message, "Question generation");

  const rawText = extractAssistantText(message);
  if (!rawText) {
    throw new Error("Empty response from Claude");
  }

  const parsed = parseJsonFromAssistant(rawText);
  return validateAndNormalizeSessionGeneration(parsed);
}

// A generation runs ~90-120s and the route allows 300s, so there is room for
// exactly one more attempt. Only spend it if the clock says it can finish.
const RETRY_IF_ELAPSED_UNDER_MS = 150_000;

export async function generateSessionInterviewPlan(
  input: GenerateSessionContentInput,
): Promise<SessionGenerationResult> {
  const client = createAnthropicClient();
  const userContent = buildUserPayload(input);
  const startedAt = Date.now();

  for (let attempt = 1; ; attempt++) {
    try {
      return await requestSessionPlan(client, userContent);
    } catch (e) {
      // API-level failures (auth, rate limits, 5xx) are already retried by the
      // SDK, so a second full generation would only burn the time budget. Retry
      // the model's own output problems: malformed JSON, a truncated response,
      // or a plan that failed shape validation.
      const worthRetrying =
        attempt === 1 &&
        !(e instanceof Anthropic.APIError) &&
        Date.now() - startedAt < RETRY_IF_ELAPSED_UNDER_MS;

      if (!worthRetrying) throw e;

      console.warn(
        `Question generation attempt ${attempt} failed, retrying once:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
}
