import type { QuestionType } from '@/types/question';

export type GradingTaskStatus = 'PENDING' | 'AI_GRADED' | 'REVIEWED';

export type GradingAiJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'SKIPPED' | 'FAILED';

export type QuestionGradingMode = 'AUTO' | 'AI_ASSISTED' | 'MANUAL';

export type ScorePublishStatus = 'UNPUBLISHED' | 'PUBLISHED';

export type ScoreBandKey = 'FAILED' | 'S60_69' | 'S70_79' | 'S80_89' | 'S90_100';

export interface ScoreBandSummary {
  key: ScoreBandKey;
  label: string;
  minPercent?: number;
  maxPercent?: number;
  count: number;
}

export interface QuestionGrade {
  questionId: string;
  order: number;
  title: string;
  type: QuestionType;
  maxScore: number;
  studentAnswer: string | string[];
  referenceAnswer: string | string[];
  gradingMode: QuestionGradingMode;
  status: GradingTaskStatus;
  autoScore?: number;
  aiSuggestedScore?: number;
  finalScore?: number;
  aiConfidence?: number;
  correct?: boolean;
  needsReview?: boolean;
  teacherComment?: string;
  aiComment?: string;
  riskLabel?: string;
  gradingSource?: string;
  aiProvider?: string;
  aiModel?: string;
  aiRubricVersion?: string;
  aiRawScore?: number;
  teacherOverrideReason?: string;
  scoreDiff?: number;
}
export interface GradingAiJob {
  id: string;
  gradingTaskId: string;
  status: GradingAiJobStatus;
  teacherId: string;
  provider?: string | null | undefined;
  model?: string | null | undefined;
  subjectiveItemCount: number;
  processedItemCount: number;
  refreshedItemCount: number;
  errorMessage?: string | null | undefined;
  durationMs?: number | null | undefined;
  promptVersion?: string | null | undefined;
  requestId?: string | null | undefined;
  resultSummary?: string | null | undefined;
  createdAt: string;
  startedAt?: string | null | undefined;
  finishedAt?: string | null | undefined;
  updatedAt: string;
}
export interface GradingTask {
  id: string;
  examId: string;
  examTitle: string;
  courseName: string;
  studentId: string;
  studentName: string;
  className: string;
  submittedAt: string;
  totalScore: number;
  currentScore: number;
  passScore: number;
  passed?: boolean;
  failed?: boolean;
  needsReview?: boolean;
  reviewReason?: string;
  status: GradingTaskStatus;
  questionGrades: QuestionGrade[];
  reviewedAt?: string;
  reviewer?: string;
}

export interface GradingScoreOverride {
  questionId: string;
  finalScore: number;
  teacherComment?: string;
}

export interface ExamScoreSummary {
  examId: string;
  examTitle: string;
  courseName: string;
  totalScore: number;
  participantCount: number;
  submittedCount: number;
  reviewedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  publishStatus: ScorePublishStatus;
  publishedAt?: string;
  scoreBands: ScoreBandSummary[];
}

export interface KnowledgeFeedback {
  knowledgePoint: string;
  scoreRate: number;
  suggestion: string;
}

export interface StudentScoreQuestionResult {
  questionId: string;
  order: number;
  title: string;
  maxScore: number;
  finalScore: number;
  teacherComment?: string;
}

export interface StudentScoreReport {
  id: string;
  examId: string;
  examTitle: string;
  courseName: string;
  studentId: string;
  studentName: string;
  className: string;
  totalScore: number;
  score?: number;
  rank?: number;
  status: ScorePublishStatus;
  submittedAt: string;
  reviewedAt?: string;
  publishedAt?: string;
  teacherComment?: string;
  knowledgeFeedback: KnowledgeFeedback[];
  questionResults: StudentScoreQuestionResult[];
}
