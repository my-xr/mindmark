export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'CASE_ANALYSIS'
  | 'PROGRAMMING';

export type Difficulty = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export type QuestionSource = 'MANUAL' | 'AI' | 'IMPORT';

export type QuestionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED' | 'REJECTED';

export type AiReviewStatus = 'PENDING' | 'ACCEPTED' | 'EDITED_ACCEPTED' | 'REJECTED';

export type AiRiskCode =
  | 'LOW_CONFIDENCE'
  | 'AMBIGUOUS_STEM'
  | 'ANSWER_NOT_UNIQUE'
  | 'KNOWLEDGE_MISMATCH'
  | 'SCORING_POINT_WEAK';

export interface QuestionOption {
  key: string;
  content: string;
}

export interface ScoringPoint {
  id: string;
  description: string;
  score: number;
  keywords: string[];
  required: boolean;
}

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  courseId: string;
  courseName: string;
  chapterId?: string | null;
  chapterNo?: number | null;
  chapterTitle?: string | null;
  knowledgePoints: string[];
  source: QuestionSource;
  status: QuestionStatus;
  score: number;
  answer: string | string[];
  analysis: string;
  options: QuestionOption[];
  scoringPoints: ScoringPoint[];
  updatedAt: string;
  createdBy: string;
}

export interface QuestionQuery {
  keyword?: string;
  type?: QuestionType | 'ALL';
  difficulty?: Difficulty | 'ALL';
  status?: QuestionStatus | 'ALL';
  source?: QuestionSource | 'ALL';
  courseId?: string | 'ALL';
  chapterId?: string | 'ALL';
  chapterFromNo?: number;
  chapterToNo?: number;
  excludePaperId?: string;
  page?: number;
  pageSize?: number;
}

export interface AiQuestionDraft {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  courseId: string;
  courseName: string;
  chapterId?: string | null;
  chapterNo?: number | null;
  chapterTitle?: string | null;
  knowledgePoints: string[];
  score: number;
  answer: string | string[];
  analysis: string;
  options: QuestionOption[];
  scoringPoints: ScoringPoint[];
  confidence: number;
  riskCodes: AiRiskCode[];
  reviewStatus: AiReviewStatus;
  model: string;
  generatedAt: string;
}

export interface AiQuestionGenerateRequest {
  courseId: string;
  provider?: 'OPENAI' | 'ANTHROPIC';
  subject: string;
  knowledgePoint: string;
  type: QuestionType;
  difficulty: Difficulty;
  count: number;
  requirement: string;
}
