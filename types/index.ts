/** Matches `sessions.status` in Supabase */
export type SessionStatus =
  | "draft"
  | "in_progress"
  | "generating_questions"
  | "awaiting_answers"
  | "scoring"
  | "completed"
  | "archived";

/** User-selected stage for the mock interview */
export type InterviewStage =
  | "Phone Screen"
  | "First Round"
  | "Final Round"
  | "Panel";

/** Inferred by Claude from JD + resume (stored on session) */
export type SeniorityLevel =
  | "intern"
  | "early_career"
  | "mid"
  | "senior"
  | "staff"
  | "executive";

/** High-level question bucket for weighting and reporting */
export type QuestionCategory =
  | "behavioral"
  | "situational"
  | "technical"
  | "role_specific"
  | "leadership"
  | "culture"
  | "closing";

/** Universal scoring dimensions (1–5 each) */
export type ScoringDimension =
  | "relevance"
  | "structure"
  | "specificity"
  | "impact_articulation"
  | "communication_clarity"
  | "analytical_reasoning"
  | "values_culture_signal";

export interface RubricDimension {
  key: ScoringDimension;
  label: string;
  description: string;
  /** Normalized weight (all weights sum to 1.0) */
  weight: number;
}

/** Stored in `questions.rubric` (jsonb) */
export interface QuestionRubric {
  dimensions: RubricDimension[];
  scaleMin: 1;
  scaleMax: 5;
  notes?: string;
}

/** Per-dimension scores for a single answer (future: stored or derived) */
export type DimensionScores = Partial<Record<ScoringDimension, number>>;

export interface Session {
  id: string;
  createdAt: string;
  userId: string;
  companyName: string | null;
  roleTitle: string | null;
  interviewStage: InterviewStage | null;
  seniorityLevel: SeniorityLevel | null;
  resumeText: string | null;
  jobDescriptionText: string | null;
  companyResearch: string | null;
  /** 0–100 when completed */
  overallScore: number | null;
  status: SessionStatus;
}

export interface Question {
  id: string;
  sessionId: string;
  questionOrder: number;
  questionText: string;
  questionCategory: QuestionCategory;
  rubric: QuestionRubric;
}

export interface Response {
  id: string;
  questionId: string;
  sessionId: string;
  transcript: string | null;
  /** 0–100 aggregate per question */
  score: number | null;
  feedback: string | null;
  modelAnswer: string | null;
  audioUrl: string | null;
  dimensionScores?: DimensionScores | null;
}

/** Session row + nested questions/responses for UI */
export interface SessionWithDetails extends Session {
  questions: (Question & { response?: Response | null })[];
}

/** Voice recording state for `VoiceRecorder` */
export type RecorderState = "idle" | "requesting" | "recording" | "stopped" | "error";

/** Supported voice memo uploads (v1) */
export type VoiceMemoMimeType =
  | "audio/webm"
  | "audio/mp4"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/x-m4a";

export interface ParsedPdfResult {
  text: string;
  pageCount?: number;
  title?: string;
}
