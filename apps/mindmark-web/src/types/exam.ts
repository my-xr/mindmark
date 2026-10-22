import type { Paper } from '@/types/paper';
import type { QuestionType } from '@/types/question';

export type ExamStatus =
  'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED' | 'GRADING' | 'GRADED' | 'PUBLISHED' | 'ARCHIVED';

export type StudentExamStatus =
  'NOT_STARTED' | 'AVAILABLE' | 'ENDED' | 'SUBMITTED' | 'GRADED' | 'ABSENT';

export type AnswerSheetStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'ABSENT';

export interface Exam {
  id: string;
  title: string;
  courseName: string;
  paperId: string;
  paper: Paper;
  classNames: string[];
  startAt?: string;
  endAt?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ExamStatus;
  participantCount: number;
  submittedCount: number;
  createdBy: string;
}

export interface StudentExamSummary {
  id: string;
  title: string;
  courseName: string;
  timeRange: string;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalScore: number;
  status: StudentExamStatus;
  submittedAt?: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  answer: string | string[];
}

export interface AnswerSheet {
  id: string;
  examId: string;
  studentId: string;
  status: AnswerSheetStatus;
  answers: StudentAnswer[];
  startedAt?: string;
  submittedAt?: string;
  version?: number;
}

export interface ExamCreateRequest {
  title: string;
  paperId: string;
  classIds: string[];
  classNames?: string[];
  startAt?: string;
  endAt?: string;
  startTime: string;
  endTime: string;
}
