import type { Question, QuestionRubric, Session } from "@/types";
import { DEFAULT_RUBRIC_DIMENSIONS } from "@/lib/scoring";

const userId = "00000000-0000-0000-0000-000000000000";

function rubricFromDefaults(weights: number[]): QuestionRubric {
  return {
    scaleMin: 1,
    scaleMax: 5,
    dimensions: DEFAULT_RUBRIC_DIMENSIONS.map((d, i) => ({
      ...d,
      weight: weights[i] ?? 1,
    })),
  };
}

export const MOCK_SESSIONS: Session[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    userId,
    companyName: "Northwind Labs",
    roleTitle: "Senior Product Engineer",
    interviewStage: "Hiring Manager",
    seniorityLevel: "senior",
    resumeText: null,
    jobDescriptionText: null,
    companyResearch: null,
    overallScore: 82,
    status: "completed",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    userId,
    companyName: "Acme Corp",
    roleTitle: "Engineering Manager",
    interviewStage: "Panel Interview",
    seniorityLevel: "senior",
    resumeText: null,
    jobDescriptionText: null,
    companyResearch: null,
    overallScore: null,
    status: "in_progress",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    createdAt: new Date().toISOString(),
    userId,
    companyName: "Globex",
    roleTitle: "Associate PM",
    interviewStage: "Phone Screen",
    seniorityLevel: "early_career",
    resumeText: null,
    jobDescriptionText: null,
    companyResearch: null,
    overallScore: null,
    status: "awaiting_answers",
  },
];

export const MOCK_QUESTION: Question = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  sessionId: MOCK_SESSIONS[1].id,
  questionOrder: 1,
  questionCategory: "behavioral",
  questionText:
    "Tell me about a time you had to align stakeholders with conflicting priorities. What was the outcome?",
  rubric: rubricFromDefaults([1, 1.1, 1, 1.25, 1.25]),
};

export const MOCK_RESULTS_QUESTIONS: {
  questionText: string;
  category: string;
  score: number;
  feedback: string;
  modelAnswer: string;
}[] = [
  {
    questionText:
      "How have you driven measurable impact in your last role?",
    category: "behavioral",
    score: 4.2,
    feedback:
      "Strong specifics on metrics; tighten the opening so it directly frames the business problem first.",
    modelAnswer:
      "In my last role, revenue per seat was flat. I led a discovery sprint, found onboarding drop-off at day 3, shipped guided setup, and lifted activation by 18% in one quarter.",
  },
  {
    questionText: "Why this company, and why now?",
    category: "culture",
    score: 3.6,
    feedback:
      "Good enthusiasm; add one sentence that ties their product strategy to your past wins.",
    modelAnswer:
      "You’re expanding into regulated industries — I shipped compliance-aware workflows at X and cut review cycles by 30%. The problems you’re solving next match where I want to compound.",
  },
];
