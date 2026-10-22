export type ReviewInsightLevel = 'GOOD' | 'WARNING' | 'RISK';

export type LectureDraftStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'FAILED';

export type LectureDraftTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type ReviewArtifactType =
  'REVIEW_REPORT_MARKDOWN' | 'LECTURE_DRAFT_MARKDOWN' | 'SCORE_SUMMARY_CSV';

export interface ScoreBand {
  label: string;
  count: number;
  ratio: number;
}

export interface QuestionPerformance {
  questionId: string;
  order: number;
  title: string;
  maxScore: number;
  averageScore: number;
  scoreRate: number;
  weaknessTags: string[];
}

export interface KnowledgeWeakness {
  knowledgePoint: string;
  scoreRate: number;
  level: ReviewInsightLevel;
  suggestion: string;
}

export interface StudentLayerInsight {
  layer: string;
  count: number;
  suggestion: string;
}

export interface ReviewArtifact {
  id: string;
  examId: string;
  artifactType: ReviewArtifactType;
  fileName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
  downloadUrl?: string | null;
}

export interface AiLectureDraft {
  id: string;
  examId: string;
  title: string;
  status: LectureDraftStatus;
  generatedAt: string;
  provider?: string | null;
  confidence: number;
  riskLabels: string[];
  outline: string[];
  content: string;
  teacherEditedContent?: string | null;
  approvedAt?: string | null;
  artifactId?: string | null;
}

export interface LectureDraftTask {
  id: string;
  examId: string;
  status: LectureDraftTaskStatus;
  provider?: string | null;
  draftId?: string | null;
  draft?: AiLectureDraft | null;
  errorMessage?: string | null;
  requestedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  updatedAt: string;
}

export interface ExamReviewReport {
  examId: string;
  examTitle: string;
  courseName: string;
  totalScore: number;
  averageScore: number;
  passRate: number;
  submittedCount: number;
  reviewedCount: number;
  scoreBands: ScoreBand[];
  questionPerformances: QuestionPerformance[];
  knowledgeWeaknesses: KnowledgeWeakness[];
  studentLayerInsights: StudentLayerInsight[];
  lectureDraft: AiLectureDraft;
  artifacts?: ReviewArtifact[];
}
