import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  type PageResponse,
  useMockApi,
} from '@/services/api/httpClient';

export type ProgrammingTestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export type ProgrammingJudgeStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'PARTIAL_ACCEPTED'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'SYSTEM_ERROR'
  | 'CANCELLED';

export interface ProgrammingTestCaseRequest {
  title: string;
  inputPayload: string;
  expectedOutput: string;
  visibility: ProgrammingTestCaseVisibility;
  weight: number;
  sortOrder?: number;
}

export interface ProgrammingTestCase extends ProgrammingTestCaseRequest {
  id: string;
  questionId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgrammingSubmissionRequest {
  questionId: string;
  language: string;
  sourceCode: string;
}

export interface ProgrammingJudgeResult {
  id: string;
  testCaseId?: string | null;
  testCaseTitle?: string | null;
  visibility?: ProgrammingTestCaseVisibility | null;
  status: ProgrammingJudgeStatus;
  actualOutputSummary?: string | null;
  stderrSummary?: string | null;
  timeMs?: number | null;
  memoryKb?: number | null;
  passed?: boolean | null;
  score?: number | null;
  createdAt: string;
}

export interface ProgrammingSubmission {
  id: string;
  examId: string;
  answerSheetId: string;
  answerItemId?: string | null;
  questionId: string;
  questionTitle: string;
  studentId: string;
  studentName: string;
  language: string;
  status: ProgrammingJudgeStatus;
  score?: number | null;
  maxScore: number;
  queuedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorSummary?: string | null;
  judgeVersion: string;
  results: ProgrammingJudgeResult[];
}

const mockDelay = <T>(data: T, timeout = 160) =>
  new Promise<T>((resolve) => window.setTimeout(() => resolve(data), timeout));

const emptyPage = <T>(page = 1, pageSize = 20): PageResponse<T> => ({
  items: [],
  total: 0,
  page,
  pageSize,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
});

export async function listProgrammingTestCases(
  questionId: string,
  page = 1,
  pageSize = 20,
): Promise<PageResponse<ProgrammingTestCase>> {
  if (!useMockApi) {
    return apiGet<PageResponse<ProgrammingTestCase>>(
      `/v1/questions/${questionId}/programming-test-cases`,
      { page, pageSize },
    );
  }

  return mockDelay(emptyPage<ProgrammingTestCase>(page, pageSize));
}

export async function createProgrammingTestCase(
  questionId: string,
  request: ProgrammingTestCaseRequest,
): Promise<ProgrammingTestCase> {
  if (!useMockApi) {
    return apiPost<ProgrammingTestCase, ProgrammingTestCaseRequest>(
      `/v1/questions/${questionId}/programming-test-cases`,
      request,
    );
  }

  const now = new Date().toISOString();
  return mockDelay({
    ...request,
    id: `PTC-${Date.now()}`,
    questionId,
    createdBy: '当前教师',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateProgrammingTestCase(
  caseId: string,
  request: ProgrammingTestCaseRequest,
): Promise<ProgrammingTestCase> {
  if (!useMockApi) {
    return apiPut<ProgrammingTestCase, ProgrammingTestCaseRequest>(
      `/v1/programming-test-cases/${caseId}`,
      request,
    );
  }

  const now = new Date().toISOString();
  return mockDelay({
    ...request,
    id: caseId,
    questionId: 'mock-question',
    createdBy: '当前教师',
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteProgrammingTestCase(caseId: string): Promise<ProgrammingTestCase> {
  if (!useMockApi) {
    return apiDelete<ProgrammingTestCase>(`/v1/programming-test-cases/${caseId}`);
  }

  const now = new Date().toISOString();
  return mockDelay({
    id: caseId,
    questionId: 'mock-question',
    title: '已删除测试用例',
    inputPayload: '',
    expectedOutput: '',
    visibility: 'PUBLIC',
    weight: 0,
    sortOrder: 0,
    createdBy: '当前教师',
    createdAt: now,
    updatedAt: now,
  });
}

export async function createProgrammingSubmission(
  examId: string,
  answerSheetId: string,
  request: ProgrammingSubmissionRequest,
): Promise<ProgrammingSubmission> {
  if (!useMockApi) {
    return apiPost<ProgrammingSubmission, ProgrammingSubmissionRequest>(
      `/v1/exams/${examId}/answer-sheets/${answerSheetId}/programming-submissions`,
      request,
    );
  }

  const now = new Date().toISOString();
  return mockDelay({
    id: `PJS-${Date.now()}`,
    examId,
    answerSheetId,
    questionId: request.questionId,
    questionTitle: '编程题',
    studentId: 'mock-student',
    studentName: '模拟学生',
    language: request.language.toUpperCase(),
    status: 'QUEUED',
    maxScore: 0,
    queuedAt: now,
    errorSummary: 'Sandbox worker 未接入，当前为 P0 契约占位。',
    judgeVersion: 'P0_CONTRACT_ONLY',
    results: [],
  });
}

export async function getProgrammingSubmission(
  submissionId: string,
): Promise<ProgrammingSubmission> {
  if (!useMockApi) {
    return apiGet<ProgrammingSubmission>(`/v1/programming-submissions/${submissionId}`);
  }
  throw new Error(`Programming submission not found: ${submissionId}`);
}

export async function listGradingTaskProgrammingJudgeResults(
  gradingTaskId: string,
  page = 1,
  pageSize = 20,
): Promise<PageResponse<ProgrammingSubmission>> {
  if (!useMockApi) {
    return apiGet<PageResponse<ProgrammingSubmission>>(
      `/v1/grading-tasks/${gradingTaskId}/programming-judge-results`,
      { page, pageSize },
    );
  }

  return mockDelay(emptyPage<ProgrammingSubmission>(page, pageSize));
}
