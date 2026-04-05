import type { QuestionRubric, ScoringDimension, SeniorityLevel } from "@/types";

/**
 * Default rubric dimensions (weights adjusted by seniority in `weightsForSeniority`).
 */
export const DEFAULT_RUBRIC_DIMENSIONS: Omit<
  QuestionRubric["dimensions"][number],
  "weight"
>[] = [
  {
    key: "relevance",
    label: "Relevance",
    description: "Answers the question that was asked.",
  },
  {
    key: "structure",
    label: "Structure",
    description: "Clear flow (e.g. STAR or equivalent).",
  },
  {
    key: "specificity",
    label: "Specificity",
    description: "Concrete examples vs. vague generalities.",
  },
  {
    key: "impact_articulation",
    label: "Impact",
    description: "Quantified or qualified outcomes where appropriate.",
  },
  {
    key: "seniority_alignment",
    label: "Seniority fit",
    description: "Depth and scope match the role level.",
  },
];

/** Seniority-aware multipliers applied to base weights before normalization. */
export function weightsForSeniority(
  seniority: SeniorityLevel | null
): Record<ScoringDimension, number> {
  const base: Record<ScoringDimension, number> = {
    relevance: 1,
    structure: 1,
    specificity: 1,
    impact_articulation: 1,
    seniority_alignment: 1,
  };

  if (!seniority) return base;

  if (
    seniority === "senior" ||
    seniority === "staff" ||
    seniority === "executive"
  ) {
    return {
      ...base,
      impact_articulation: 1.35,
      seniority_alignment: 1.35,
      structure: 0.95,
      relevance: 0.95,
    };
  }

  if (seniority === "intern" || seniority === "early_career") {
    return {
      ...base,
      structure: 1.25,
      relevance: 1.2,
      seniority_alignment: 0.9,
      impact_articulation: 0.95,
    };
  }

  return base;
}

/**
 * Overall session score: average of per-question scores (1–5), normalized to 0–100.
 */
export function sessionScoreFromQuestionScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  const avg =
    scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
  return Math.round(((avg - 1) / 4) * 100);
}
