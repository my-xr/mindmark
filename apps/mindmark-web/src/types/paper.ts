import type { Difficulty, Question, QuestionType } from '@/types/question';

export type PaperStatus = 'DRAFT' | 'READY' | 'PUBLISHED' | 'ARCHIVED';
export type PaperComposeMode = 'APPEND' | 'REPLACE';
export type PaperComposeStrategy = 'RANDOM' | 'AGENT';

export interface PaperQuestion {
  id: string;
  questionId: string;
  order: number;
  score: number;
  question: Question;
}

export interface CreatePaperRequest {
  title: string;
  courseId: string;
  description?: string | null;
  durationMinutes: number;
}

export interface Paper {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  description: string;
  durationMinutes: number;
  totalScore: number;
  status: PaperStatus;
  questions: PaperQuestion[];
  createdBy: string;
  updatedAt: string;
}

export interface PaperAnswerKeyItem {
  id: string;
  questionId: string;
  order: number;
  score: number;
  question: Question;
}

export interface PaperAnswerKey {
  paperId: string;
  title: string;
  courseId: string;
  courseName: string;
  totalScore: number;
  generatedAt: string;
  items: PaperAnswerKeyItem[];
}

export interface PaperComposeRule {
  type: QuestionType;
  count: number;
  score: number;
  difficulties: Difficulty[];
  chapterIds: string[];
  chapterFromNo?: number | null;
  chapterToNo?: number | null;
  knowledgePoints: string[];
}

export interface PaperComposeRequest {
  targetScore: number;
  mode: PaperComposeMode;
  rules: PaperComposeRule[];
}

export interface PaperComposeGap {
  type: QuestionType;
  requiredCount: number;
  availableCount: number;
  knowledgePoints: string[];
  message: string;
}

export interface PaperComposeDistributionItem {
  key: string;
  label: string;
  count: number;
  score: number;
  percentage: number;
}

export interface PaperComposeQualityReport {
  targetScore: number;
  actualScore: number;
  totalQuestionCount: number;
  knowledgePointCount: number;
  typeDistribution: PaperComposeDistributionItem[];
  difficultyDistribution: PaperComposeDistributionItem[];
  chapterDistribution: PaperComposeDistributionItem[];
  knowledgePointDistribution: PaperComposeDistributionItem[];
  highlights: string[];
  risks: string[];
}

export interface PaperComposeAgentPlan {
  workflow: string;
  summary: string;
  steps: string[];
  rationale: string[];
  recommendations: string[];
}

export interface PaperComposePreview {
  paperId: string;
  mode: PaperComposeMode;
  strategy: PaperComposeStrategy;
  targetScore: number;
  currentScore: number;
  plannedAddedScore: number;
  plannedFinalScore: number;
  plannedAddedCount: number;
  ready: boolean;
  gaps: PaperComposeGap[];
  warnings: string[];
  qualityReport: PaperComposeQualityReport;
  agentPlan: PaperComposeAgentPlan;
}

export interface PaperComposeResult {
  paper: Paper;
  addedCount: number;
  addedScore: number;
  targetScore: number;
  actualScore: number;
  mode: PaperComposeMode;
  strategy: PaperComposeStrategy;
  gaps: PaperComposeGap[];
  warnings: string[];
  qualityReport: PaperComposeQualityReport;
  agentPlan: PaperComposeAgentPlan;
}
