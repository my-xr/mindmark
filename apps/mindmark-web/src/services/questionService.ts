import { mockPapers } from '@/mock/paperExamMock';
import { mockQuestions } from '@/mock/questionMock';
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  type PageResponse,
  useMockApi,
} from '@/services/api/httpClient';
import type { Question, QuestionOption, QuestionQuery, ScoringPoint } from '@/types/question';

export interface MarkdownQuestionImportRequest {
  courseId: string;
  chapterId?: string | null;
  fileName?: string;
  markdown: string;
}

export interface MarkdownQuestionImportResponse {
  parsedCount: number;
  importedCount: number;
  skippedCount: number;
  warnings: string[];
  importedQuestions: Question[];
}
export interface QuestionDeleteResponse {
  id: string;
  physicallyDeleted: boolean;
  status?: Question['status'] | null;
  message: string;
}

export interface QuestionUpsertRequest {
  courseId: string;
  chapterId?: string | null;
  title: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  knowledgePoints: string[];
  score: number;
  answer: string | string[];
  analysis: string;
  options: QuestionOption[];
  scoringPoints: ScoringPoint[];
}

const mockDelay = <T>(data: T, timeout = 240) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let questionStore: Question[] = mockQuestions.map((question) => ({ ...question }));

const normalizeKeyword = (keyword?: string) => keyword?.trim().toLowerCase() ?? '';

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const matchesKeyword = (question: Question, keyword: string) => {
  if (!keyword) {
    return true;
  }

  return [
    question.id,
    question.title,
    question.createdBy,
    question.courseName ?? '',
    question.analysis ?? '',
    ...question.knowledgePoints,
  ]
    .join(' ')
    .toLowerCase()
    .includes(keyword);
};

const toQueryParams = (query: QuestionQuery): Record<string, unknown> => {
  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 100,
  };

  if (query.keyword?.trim()) {
    params.keyword = query.keyword.trim();
  }
  if (query.type && query.type !== 'ALL') {
    params.type = query.type;
  }
  if (query.difficulty && query.difficulty !== 'ALL') {
    params.difficulty = query.difficulty;
  }
  if (query.status && query.status !== 'ALL') {
    params.status = query.status;
  }
  if (query.source && query.source !== 'ALL') {
    params.source = query.source;
  }
  if (query.courseId && query.courseId !== 'ALL') {
    params.courseId = query.courseId;
  }
  if (query.chapterId && query.chapterId !== 'ALL') {
    params.chapterId = query.chapterId;
  }
  if (query.chapterFromNo !== undefined) {
    params.chapterFromNo = query.chapterFromNo;
  }
  if (query.chapterToNo !== undefined) {
    params.chapterToNo = query.chapterToNo;
  }
  if (query.excludePaperId?.trim()) {
    params.excludePaperId = query.excludePaperId.trim();
  }

  return params;
};

const filterQuestions = (query: QuestionQuery = {}) => {
  const keyword = normalizeKeyword(query.keyword);
  const excludedQuestionIds = new Set(
    query.excludePaperId?.trim()
      ? (
          mockPapers.find((paper) => paper.id === query.excludePaperId?.trim())?.questions ?? []
        ).map((item) => item.questionId)
      : [],
  );

  return questionStore.filter((question) => {
    const typeMatched = !query.type || query.type === 'ALL' || question.type === query.type;
    const difficultyMatched =
      !query.difficulty || query.difficulty === 'ALL' || question.difficulty === query.difficulty;
    const statusMatched =
      !query.status || query.status === 'ALL' || question.status === query.status;
    const sourceMatched =
      !query.source || query.source === 'ALL' || question.source === query.source;
    const courseMatched =
      !query.courseId || query.courseId === 'ALL' || question.courseId === query.courseId;
    const chapterMatched =
      (!query.chapterId || query.chapterId === 'ALL' || question.chapterId === query.chapterId) &&
      (query.chapterFromNo === undefined ||
        Number(question.chapterNo ?? 0) >= query.chapterFromNo) &&
      (query.chapterToNo === undefined || Number(question.chapterNo ?? 0) <= query.chapterToNo);

    return (
      typeMatched &&
      difficultyMatched &&
      statusMatched &&
      sourceMatched &&
      courseMatched &&
      chapterMatched &&
      !excludedQuestionIds.has(question.id) &&
      matchesKeyword(question, keyword)
    );
  });
};

export async function importMarkdownQuestions(
  request: MarkdownQuestionImportRequest,
): Promise<MarkdownQuestionImportResponse> {
  if (!useMockApi) {
    return apiPost<MarkdownQuestionImportResponse, MarkdownQuestionImportRequest>(
      '/v1/questions/import/markdown',
      request,
    );
  }

  const imported: Question = {
    id: `Q-MD-${Date.now()}`,
    title: 'Markdown 导入示例题（Mock）',
    type: 'SINGLE_CHOICE',
    difficulty: 'EASY',
    courseId: request.courseId,
    courseName: request.courseId,
    chapterId: request.chapterId ?? null,
    chapterNo: null,
    chapterTitle: null,
    knowledgePoints: [request.courseId],
    source: 'IMPORT',
    status: 'ACTIVE',
    score: 2,
    answer: 'A',
    analysis: 'Mock 模式下仅验证导入交互；真实 Markdown 解析请切换到后端接口。',
    options: [
      { key: 'A', content: '示例选项 A' },
      { key: 'B', content: '示例选项 B' },
    ],
    scoringPoints: [],
    updatedAt: nowText(),
    createdBy: '当前教师',
  };
  questionStore = [imported, ...questionStore];

  return mockDelay({
    parsedCount: 1,
    importedCount: 1,
    skippedCount: 0,
    warnings: ['当前为 Mock 模式：未真正解析 Markdown 文件内容。'],
    importedQuestions: [{ ...imported }],
  });
}
export async function listQuestionsPage(
  query: QuestionQuery = {},
): Promise<PageResponse<Question>> {
  if (!useMockApi) {
    return apiGet<PageResponse<Question>>('/v1/questions', toQueryParams(query));
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
  const filtered = filterQuestions(query);
  const start = (page - 1) * pageSize;

  return mockDelay({
    items: filtered.slice(start, start + pageSize).map((question) => ({ ...question })),
    total: filtered.length,
    page,
    pageSize,
  });
}

export async function listQuestions(query: QuestionQuery = {}): Promise<Question[]> {
  const page = await listQuestionsPage({
    ...query,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 100,
  });

  return page.items;
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  if (!useMockApi) {
    return apiGet<Question>(`/v1/questions/${id}`);
  }

  return mockDelay(questionStore.find((question) => question.id === id));
}

export async function createQuestion(request: QuestionUpsertRequest): Promise<Question> {
  if (!useMockApi) {
    return apiPost<Question, QuestionUpsertRequest>('/v1/questions', request);
  }

  const next: Question = {
    id: `Q-${Date.now()}`,
    title: request.title,
    type: request.type,
    difficulty: request.difficulty,
    courseId: request.courseId,
    courseName: request.courseId,
    chapterId: request.chapterId ?? null,
    chapterNo: null,
    chapterTitle: null,
    knowledgePoints: request.knowledgePoints,
    source: 'MANUAL',
    status: 'ACTIVE',
    score: request.score,
    answer: request.answer,
    analysis: request.analysis,
    options: request.options,
    scoringPoints: request.scoringPoints,
    updatedAt: nowText(),
    createdBy: '当前教师',
  };
  questionStore = [next, ...questionStore];

  return mockDelay({ ...next });
}

export async function updateQuestion(
  id: string,
  request: QuestionUpsertRequest,
): Promise<Question> {
  if (!useMockApi) {
    return apiPut<Question, QuestionUpsertRequest>(`/v1/questions/${id}`, request);
  }

  const previous = questionStore.find((question) => question.id === id);
  if (!previous) {
    throw new Error('题目不存在');
  }

  const next: Question = {
    ...previous,
    ...request,
    courseName: previous.courseName,
    status:
      previous.source === 'AI' && previous.status === 'REJECTED'
        ? 'PENDING_REVIEW'
        : previous.status,
    updatedAt: nowText(),
  };
  questionStore = questionStore.map((question) => (question.id === id ? next : question));

  return mockDelay({ ...next });
}

export async function deleteQuestion(id: string): Promise<QuestionDeleteResponse> {
  if (!useMockApi) {
    return apiDelete<QuestionDeleteResponse>(`/v1/questions/${id}`);
  }

  const previous = questionStore.find((question) => question.id === id);
  if (!previous) {
    throw new Error('题目不存在');
  }

  questionStore = questionStore.filter((question) => question.id !== id);

  return mockDelay({
    id,
    physicallyDeleted: true,
    status: null,
    message: '题目已删除。',
  });
}
