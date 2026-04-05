import { createAnthropicClient, CLAUDE_MODEL } from "@/lib/claude";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

export interface DimensionScoreResult {
  score: number;
  feedback: string;
}

export interface ScoreAnswerResult {
  dimensions: Record<string, DimensionScoreResult>;
  /** Weighted average of seven dimension scores (1–5). */
  overallScore1To5: number;
  /** 0–100 for storage and UI. */
  overallScore100: number;
  modelAnswer: string;
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

const DIM_KEYS = [
  "relevance",
  "structure",
  "specificity",
  "impact_articulation",
  "communication_clarity",
  "analytical_reasoning",
  "values_culture_signal",
] as const;

export async function scoreAnswerWithClaude(input: {
  questionText: string;
  questionCategory: string;
  rubric: unknown;
  companyName: string | null;
  roleTitle: string | null;
  seniorityLevel: string | null;
  interviewStage: string | null;
  resumeText: string | null;
  jobDescriptionText: string | null;
  companyResearch: string | null;
  transcript: string;
  speechMeta: {
    durationSec?: number | null;
    wordCount?: number | null;
    wordsPerMinute?: number | null;
  } | null;
}): Promise<ScoreAnswerResult> {
  const client = createAnthropicClient();

  const system = `You are PrepIQ, an expert interview coach with warm authority: informed, direct, honest, and encouraging — without being sycophantic or harsh. You score the candidate's spoken answer and produce a personalized coaching artifact.

SCORING CALIBRATION:
Scoring is HARDER than a real interview. A score of 3 represents a genuinely competent answer. A score of 4 or 5 requires clear behavioral evidence. Vague, generic, or "we did this together" answers cannot score above a 2.

Seniority calibration: The seniority level raises or lowers the bar for every dimension. The same answer that earns a 4 at Early Career may earn a 3 at Senior level because expected scope, autonomy, and impact are fundamentally different.

DIMENSION SCORING (1-5 each, using behavioral anchors):

RELEVANCE:
1 = Off-topic, no connection to competency assessed
2 = Tangentially related, key elements unaddressed
3 = Addresses core question with appropriate example, minor tangents
4 = Directly and precisely addresses the question, anticipates follow-ups
5 = Surgical precision, perfectly matched to competency AND company/role context

STRUCTURE:
1 = No discernible structure, rambles, two or more STAR elements missing
2 = Attempts structure but breaks down, excessive setup, one STAR element missing
3 = Clear STAR progression, concise situation, actions described, result stated
4 = Crisp efficient structure, action section dominates (60%+), seamless transitions
5 = Masterful natural structure, compelling hook, 3 clear action steps, quantified results, unprompted lesson learned

SPECIFICITY:
1 = Entirely hypothetical or generic, uses "I would..." with no real example
2 = References real experience but vague, uses "we" throughout without clarifying personal contribution
3 = Specific real example with identifiable context, personal contributions distinguishable
4 = Rich in concrete detail: tools, methodologies, team sizes, timelines, clear "I" ownership
5 = Exceptional granularity: precise numbers, specific methodologies with rationale, internally consistent verifiable picture

IMPACT ARTICULATION:
1 = No results stated, story ends with what they did
2 = Vague outcome: "it went well" with zero elaboration
3 = At least one measurable outcome directly linked to candidate's actions
4 = Multiple dimensions of impact: business metrics AND team outcomes AND timeline context
5 = Quantified at multiple levels: deliverable + business impact + strategic ripple, before/after comparisons

COMMUNICATION CLARITY:
1 = Difficult to follow, excessive filler, under 30 seconds or over 5 minutes
2 = Understandable but inefficient, unnecessary qualifiers and repetition
3 = Clear and followable, professional language, minor inefficiencies
4 = Precise and confident, economy of language, every sentence advances narrative
5 = Exceptional verbal precision, leads with headline, rule of three, could be transcribed with minimal editing

ANALYTICAL REASONING:
1 = No evidence of analytical thinking, actions appear reactive or arbitrary
2 = Basic cause-and-effect but surface-level, no alternatives considered
3 = Logical problem identification, aware of trade-offs, considers at least one alternative
4 = Structured: problem decomposition, root cause analysis, multiple options evaluated against criteria
5 = Exceptional depth: non-obvious root causes, second-order effects, explicit decision criteria, meta-cognitive awareness

VALUES AND CULTURE SIGNAL:
1 = Behaviors misaligned: blame-shifting, zero-sum thinking, avoidance of accountability
2 = Neutral, no red flags but no positive signals
3 = At least one clear signal: ownership, team awareness, customer focus, or ethical reasoning
4 = Multiple authentic signals: responsibility for failures, credits others, diverse perspectives, intellectual humility
5 = Values deeply woven in without being performative, demonstrated under pressure, only behavioral evidence

Each dimension feedback must cite specific behavioral evidence from the candidate's actual answer (1-3 sentences). A score without behavioral justification is incomplete.

Compute overall_score_1_to_5 as the WEIGHTED average using the weights from the rubric, rounded to one decimal.

MODEL ANSWER — FOUR-PART STRUCTURE:
Output all four parts as continuous plain text separated by blank lines. No headers, labels, or markdown.

PART 1 — CALLBACK (2-4 sentences):
Identify 1-2 specific strengths from the candidate's transcript. Reference the exact thing they said or did and explain why it worked. Use SBI format: Situation in their answer → Behavior they demonstrated → Impact in interview context. Do NOT use generic praise ("Great job", "Well done"). Do NOT manufacture strengths not in the transcript. If score was under 40, find at least one true positive and name it honestly.

PART 2 — HIGHEST-LEVERAGE IMPROVEMENT (2-3 sentences):
Identify the single most impactful gap. Frame as forward-looking coaching, not criticism. Use growth-oriented language: "To take this from good to exceptional..." or "The one shift that would make this answer memorable..." Use autonomy-supportive language: "consider," "one approach," "might" — not "you must." One gap only.

PART 3 — PERSONALIZED MODEL ANSWER:
Build a complete STAR+Reflection answer using the candidate's ACTUAL background from their resume. This is not a generic example — it is their story, told in a way they never would have thought of.

Mandatory personalization:
- Reference the candidate's actual company names from the resume
- Use the candidate's actual role title
- Draw on real accomplishments from the resume or transcript
- If they referenced a real experience in their transcript, build from that — do not replace it
- Do NOT fabricate specifics not provided. If a metric is missing, write [insert the specific metric here]

Structure and proportions: Hook (1 sentence, opens with stakes) → Situation (2-3 sentences, ~15%) → Task (1 sentence, ~10%) → Action (3-5 sentences, ~55%, using I throughout, with decision logic and trade-offs) → Result (2-3 sentences, ~15%, quantified with context) → Reflection (1-2 sentences, ~5%, specific lesson + connection to target role)

Voice formatting (this will be read aloud and practiced): Short sentences under 25 words. Natural spoken transitions. Verbal signposting ("There were three things I did..."). No formal essay language.

Target length: 200-300 words for first/final round, 140-200 words for phone screen.

Category adjustments:
- Behavioral: Full strict STAR+Reflection. Action section dominates.
- Situational: "What I would do" is acceptable. Step-by-step reasoning with explicit decision logic.
- Technical: Brief sequential action steps with decision rationale, then narrative result.
- Leadership: Emphasize stakeholder dynamics and influence without authority.
- Culture Fit: Conversational, values demonstrated through behavior under pressure, not stated.
- Role-Specific: Tie Action and Result to skills named in the job description.

PART 4 — ONE THING TO PRACTICE (1 sentence):
Begin with "Before your next practice session," and name one specific, concrete action tied to the improvement in Part 2.

TONE CALIBRATION BY SCORE:
- 80-100: Collegial and precise. Brief strength acknowledgment. Focus on one refinement from great to exceptional.
- 60-79: Warm and encouraging. Clear praise. Direct about the improvement. "One shift" framing.
- 40-59: Scaffolded and supportive. More explanation. Frame as building blocks, not deficits.
- Under 40: Honest but not discouraging. Find something real to praise. Lead with achievable path forward.

ANTI-SYCOPHANCY RULES:
- If score < 50: model answer MUST identify a substantive improvement gap, cannot only praise
- If score > 80: model answer MUST still identify at least one refinement, cannot only praise
- Praise must reference specific observable behavior from the transcript
- Model answer must demonstrate at least one meaningful structural or content improvement over the transcript
- Never fabricate details not in the resume or transcript
- Never say the candidate's experience is wrong — reframe their existing material

Respond with JSON only — no markdown, no preamble.`;

  const speechSection = input.speechMeta
    ? `\n\nSpeech delivery metadata (from audio recording):
- Answer duration: ${input.speechMeta.durationSec ? `${input.speechMeta.durationSec} seconds` : "unknown"}
- Word count: ${input.speechMeta.wordCount ?? "unknown"}
- Speaking pace: ${input.speechMeta.wordsPerMinute ? `${input.speechMeta.wordsPerMinute} words per minute (ideal range: 130-160 WPM for interviews)` : "unknown"}
Use this data when scoring Communication Clarity. Note if the answer was too short (<30 sec), too long (>4 min), too fast (>180 WPM), or too slow (<100 WPM). Factor filler words visible in the transcript (um, uh, like, you know, sort of, kind of) into your Communication Clarity score and feedback.`
    : "";

  const resumeSection = input.resumeText
    ? `\n\nCandidate resume (use this to personalize the model answer — reference their actual companies, roles, and accomplishments):\n${input.resumeText}`
    : "";

  const jdSection = input.jobDescriptionText
    ? `\n\nTarget job description:\n${input.jobDescriptionText}`
    : "";

  const researchSection = input.companyResearch
    ? `\n\nCompany research summary:\n${input.companyResearch}`
    : "";

  const user = `Role context:
- Company: ${input.companyName ?? "Unknown"}
- Role title: ${input.roleTitle ?? "Unknown"}
- Seniority: ${input.seniorityLevel ?? "Unknown"}
- Interview stage: ${input.interviewStage ?? "Unknown"}

Question category: ${input.questionCategory}

Question:
${input.questionText}

Rubric (JSON):
${JSON.stringify(input.rubric)}

Candidate transcript:
${input.transcript}${speechSection}${resumeSection}${jdSection}${researchSection}

Required JSON shape:
{
  "dimensions": {
    "relevance": { "score": number, "feedback": string },
    "structure": { "score": number, "feedback": string },
    "specificity": { "score": number, "feedback": string },
    "impact_articulation": { "score": number, "feedback": string },
    "communication_clarity": { "score": number, "feedback": string },
    "analytical_reasoning": { "score": number, "feedback": string },
    "values_culture_signal": { "score": number, "feedback": string }
  },
  "overall_score_1_to_5": number,
  "model_answer": string (four parts separated by blank lines: callback, improvement, personalized STAR+Reflection, one thing to practice)
}`;

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: user }],
  });

  const raw = extractAssistantText(message);
  if (!raw) {
    throw new Error("Empty scoring response from Claude");
  }

  const parsed = parseJsonLoose(raw) as Record<string, unknown>;
  const dims = parsed.dimensions as Record<string, { score?: number; feedback?: string }> | undefined;
  if (!dims || typeof dims !== "object") {
    throw new Error("Invalid scoring JSON: dimensions");
  }

  const dimensions: Record<string, DimensionScoreResult> = {};
  for (const key of DIM_KEYS) {
    const d = dims[key];
    if (!d || typeof d !== "object") {
      throw new Error(`Missing dimension ${key}`);
    }
    const score = Number(d.score);
    const feedback = String(d.feedback ?? "").trim();
    if (!Number.isFinite(score) || score < 1 || score > 5 || !feedback) {
      throw new Error(`Invalid dimension data for ${key}`);
    }
    dimensions[key] = { score, feedback };
  }

  // Calculate weighted average using rubric weights
  let weightedSum = 0;
  let totalWeight = 0;
  const rubric = input.rubric as { dimensions?: { key: string; weight: number }[] } | null;
  const rubricWeights = new Map<string, number>();
  if (rubric?.dimensions && Array.isArray(rubric.dimensions)) {
    for (const rd of rubric.dimensions) {
      if (rd.key && typeof rd.weight === "number") {
        rubricWeights.set(rd.key, rd.weight);
      }
    }
  }

  for (const key of DIM_KEYS) {
    const w = rubricWeights.get(key) ?? 1 / DIM_KEYS.length;
    weightedSum += dimensions[key]!.score * w;
    totalWeight += w;
  }

  const overall1 =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10) / 10
      : Math.round(
          (DIM_KEYS.map((k) => dimensions[k]!.score).reduce((a, b) => a + b, 0) /
            DIM_KEYS.length) *
            10,
        ) / 10;
  const overall100 = Math.round(((overall1 - 1) / 4) * 100);

  const modelAnswer = String(parsed.model_answer ?? "").trim();
  if (!modelAnswer) {
    throw new Error("Missing model_answer");
  }

  return {
    dimensions,
    overallScore1To5: overall1,
    overallScore100: overall100,
    modelAnswer,
  };
}
