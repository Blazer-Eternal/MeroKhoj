/**
 * Phase 2 AI feature contracts.
 *
 * Payload shapes exchanged between the AI services, controllers and the
 * frontend. The LLM returns looser JSON, which each service normalises into
 * these types before anything is stored or rendered.
 */

// ---------------------------------------------------------------------------
// 1. Resume parsing
// ---------------------------------------------------------------------------

export interface IParsedEducation {
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface IParsedExperience {
  company_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

/** Structured resume payload produced by the AI parser. */
export interface IParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  headline: string | null;
  summary: string | null;
  education: IParsedEducation[];
  experience: IParsedExperience[];
  skills: string[];
  certifications: string[];
}

/** What applying a parsed payload actually changed on the profile. */
export interface IApplyResult {
  profile_fields_updated: string[];
  skills_added: string[];
  skills_unmatched: string[];
  educations_added: number;
  experiences_added: number;
}

// ---------------------------------------------------------------------------
// 2. Resume improvement
// ---------------------------------------------------------------------------

export type ResumeImprovementArea =
  | 'summary'
  | 'experience'
  | 'skills'
  | 'grammar'
  | 'formatting';

export interface IResumeSuggestion {
  area: ResumeImprovementArea;
  /** The original excerpt the suggestion applies to ("" for whole-doc notes). */
  original: string;
  /** Replacement / improved text the user can accept (CVCraft "Use"). */
  suggestion: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// 3. Job description generator
// ---------------------------------------------------------------------------

export const JD_TONES = ['NEUTRAL', 'FORMAL', 'FUNNY', 'ACADEMIC', 'EXCITING'] as const;
export type JDTone = (typeof JD_TONES)[number];

export interface IJobDescriptionDraft {
  tone: JDTone;
  overview: string;
  responsibilities: string[];
  required_qualifications: string[];
  required_skills: string[];
  experience_requirements: string;
}

// ---------------------------------------------------------------------------
// 4. Career assistant
// ---------------------------------------------------------------------------

export type CareerQuickAction =
  | 'CAREER_STRATEGY'
  | 'RESUME_REVIEW'
  | 'INTERVIEW_PREP'
  | 'SKILL_ANALYSIS'
  | 'DISCOVER_JOBS';

export interface ICareerChatReply {
  reply: string;
  quick_action: CareerQuickAction | null;
}

// ---------------------------------------------------------------------------
// 5. Skill gap analysis
// ---------------------------------------------------------------------------

export type SkillGapStatus = 'MATCHED' | 'MISSING';

export interface ISkillGapItem {
  skill_id: string | null;
  skill: string;
  importance: 'REQUIRED' | 'PREFERRED';
  status: SkillGapStatus;
  /** 0-100 current proficiency estimate (0 = not held). */
  current_level: number;
  /** 0-100 the job expects. */
  target_level: number;
  /** target_level - current_level, clamped at 0. */
  gap: number;
  learning_tip: string;
}

export interface ISkillGapReport {
  job_id: string;
  job_title: string;
  total_gap: number;
  average_gap: number;
  critical_gaps: ISkillGapItem[];
  strengths: ISkillGapItem[];
  items: ISkillGapItem[];
  /** Phase 1 match score for context (why this job was analysed). */
  match_score: number | null;
  /** False when learning tips came from the static library (no LLM key). */
  ai_configured: boolean;
}

// ---------------------------------------------------------------------------
// 6. Interview preparation
// ---------------------------------------------------------------------------

export interface IPracticeQuestion {
  id?: string;
  sort_order?: number;
  category: string;
  question: string;
  answer?: string | null;
  score?: number | null;
  feedback?: IAnswerFeedback | null;
  answered_at?: Date | null;
}

export interface IAnswerBreakdown {
  relevance: number;
  structure: number;
  specificity: number;
  communication: number;
}

export interface IAnswerFeedback {
  score: number;
  breakdown: IAnswerBreakdown;
  strengths: string[];
  improvements: string[];
  insight: string;
}

export interface IPracticeSession {
  id?: string;
  job_title: string;
  industry: string | null;
  skills: string[];
  question_count: number;
  questions: IPracticeQuestion[];
  created_at?: Date;
}

// ---------------------------------------------------------------------------
// 7. Semantic job search
// ---------------------------------------------------------------------------

/** Filters read out of a natural-language query by the intent parser. */
export interface ISearchIntent {
  /** Remaining meaningful keywords after filter extraction. */
  keywords: string[];
  employment_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  remote_only: boolean;
  posted_within_days: number | null;
}

export type SemanticSearchMode = 'SEMANTIC' | 'KEYWORD';

export interface ISemanticMatch {
  job_id: string;
  /** 0-100 similarity score. */
  match_score: number;
  /** Human-readable justification shown to the user. */
  why: string;
}

export interface ISemanticSearchResult {
  mode: SemanticSearchMode;
  intent: ISearchIntent;
  matches: ISemanticMatch[];
}
