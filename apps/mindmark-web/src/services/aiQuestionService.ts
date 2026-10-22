import { mockAiQuestionDrafts } from '@/mock/questionMock';
import { apiGet, apiPost, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';
import type {
  AiQuestionDraft,
  AiQuestionGenerateRequest,
  AiReviewStatus,
  QuestionOption,
  ScoringPoint,
} from '@/types/question';

export type AiProvider = 'OPENAI' | 'ANTHROPIC';
export type AiQuestionDraftFilterStatus = 'PENDING_REVIEW' | 'REJECTED' | 'ALL';
export type AiQuestionGenerationTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface AiProviderSetting {
  provider: AiProvider;
  providerLabel: string;
  configured: boolean;
  keyPreview?: string | null;
  baseUrl: string;
  model: string;
  updatedAt?: string | null;
}

export interface AiProviderSettingRequest {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface AiProviderConnectionTestRequest {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface AiProviderConnectionTestResponse {
  success: boolean;
  provider: AiProvider;
  providerLabel: string;
  baseUrl?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  message: string;
  responsePreview?: string | null;
  testedAt: string;
}

export interface AiQuestionGenerationTask {
  id: string;
  status: AiQuestionGenerationTaskStatus;
  provider: AiProvider;
  courseId: string;
  generatedCount?: number | null;
  generatedQuestionIds: string[];
  errorMessage?: string | null;
  requestedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  updatedAt: string;
}

export interface AiQuestionGenerationTaskListItem extends AiQuestionGenerationTask {
  courseName?: string | null;
  prompt?: string | null;
  questionType?: string | null;
  difficulty?: string | null;
  count?: number | null;
  knowledgePoint?: string | null;
  requirement?: string | null;
  teacherName?: string | null;
}

interface ServerAiQuestionGenerateRequest {
  courseId: string;
  provider: AiProvider;
  prompt: string;
  questionType: AiQuestionGenerateRequest['type'];
  difficulty: AiQuestionGenerateRequest['difficulty'];
  count: number;
  knowledgePoint: string;
  requirement: string;
}

interface ServerQuestionResponse {
  id: string;
  title: string;
  type: AiQuestionDraft['type'];
  difficulty: AiQuestionDraft['difficulty'];
  courseId: string;
  courseName: string;
  knowledgePoints: string[];
  score: number | string;
  answer: string | string[];
  analysis: string;
  options: QuestionOption[];
  scoringPoints: ScoringPoint[];
  updatedAt: string;
  createdBy: string;
  source?: 'MANUAL' | 'AI' | 'IMPORT';
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  reviewAction?: Exclude<AiReviewStatus, 'PENDING'> | null;
}

const mockDelay = <T>(data: T, timeout = 360) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let aiDrafts: AiQuestionDraft[] = mockAiQuestionDrafts.map((draft) => ({ ...draft }));
let generatedSequence = 3000;
let mockTaskHistory: AiQuestionGenerationTaskListItem[] = [];

export const providerLabels: Record<AiProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

export const providerDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {
  OPENAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
  ANTHROPIC: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
};

const AI_CONNECTION_TEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_AI_CONNECTION_TEST_TIMEOUT_MS || 45000,
);
const AI_QUESTION_TASK_POLL_INTERVAL_MS = Number(
  import.meta.env.VITE_AI_TASK_POLL_INTERVAL_MS || 1500,
);
const AI_QUESTION_TASK_MAX_WAIT_MS = Number(import.meta.env.VITE_AI_TASK_MAX_WAIT_MS || 180000);

const sleep = (timeout: number) => new Promise((resolve) => window.setTimeout(resolve, timeout));

const createEmptyProviderSetting = (provider: AiProvider): AiProviderSetting => ({
  provider,
  providerLabel: providerLabels[provider],
  configured: false,
  keyPreview: null,
  baseUrl: providerDefaults[provider].baseUrl,
  model: providerDefaults[provider].model,
  updatedAt: null,
});

let mockProviderSettings: Record<AiProvider, AiProviderSetting> = {
  OPENAI: createEmptyProviderSetting('OPENAI'),
  ANTHROPIC: createEmptyProviderSetting('ANTHROPIC'),
};

const nowText = () => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const nowIso = () => new Date().toISOString();

const normalizeCount = (count: number) => Math.min(Math.max(Number(count) || 1, 1), 5);

const getPromptTopic = (request: AiQuestionGenerateRequest) =>
  request.knowledgePoint?.trim() || request.subject?.trim() || '课程核心知识点';

const buildOptions = (index: number): QuestionOption[] => [
  { key: 'A', content: `正确选项 ${index}` },
  { key: 'B', content: '容易混淆但条件不完整的选项' },
  { key: 'C', content: '只覆盖部分概念的干扰项' },
  { key: 'D', content: '与题干知识点无直接关系的选项' },
];

const buildScoringPoints = (knowledgePoint: string): ScoringPoint[] => [
  {
    id: `SP-${generatedSequence}-1`,
    description: `说明 ${knowledgePoint} 的核心概念`,
    score: 3,
    keywords: [knowledgePoint, '核心概念'],
    required: true,
  },
  {
    id: `SP-${generatedSequence}-2`,
    description: '结合示例说明应用场景',
    score: 3,
    keywords: ['示例', '应用场景'],
    required: true,
  },
];

const createDraftTitle = (request: AiQuestionGenerateRequest, index: number) => {
  const topic = getPromptTopic(request);

  if (request.type === 'SHORT_ANSWER') {
    return `请简述 ${topic} 的核心思想（${index}）`;
  }
  if (request.type === 'ESSAY') {
    return `请论述 ${topic} 的原理、应用与局限（${index}）`;
  }
  if (request.type === 'CASE_ANALYSIS') {
    return `请结合案例分析 ${topic} 的问题与解决方案（${index}）`;
  }
  if (request.type === 'PROGRAMMING') {
    return `请实现一个与 ${topic} 相关的编程任务（${index}）`;
  }
  if (request.type === 'TRUE_FALSE') {
    return `判断关于 ${topic} 的表述是否正确（${index}）`;
  }
  if (request.type === 'FILL_BLANK') {
    return `${topic} 中的关键概念填空题（${index}）`;
  }

  return `关于 ${topic} 的课堂测验题（${index}）`;
};

const createGeneratedDraft = (
  request: AiQuestionGenerateRequest,
  index: number,
): AiQuestionDraft => {
  generatedSequence += 1;
  const topic = getPromptTopic(request);
  const courseName = request.subject?.trim() || request.courseId;
  const confidence = Math.max(0.78, 0.94 - index * 0.03);
  const riskCodes = index % 2 === 0 ? (['LOW_CONFIDENCE'] as const) : [];
  const isChoice = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(request.type);

  return {
    id: `AI-${generatedSequence}`,
    title: createDraftTitle(request, index),
    type: request.type,
    difficulty: request.difficulty,
    courseId: request.courseId,
    courseName,
    knowledgePoints: [topic],
    score: ['SHORT_ANSWER', 'ESSAY', 'CASE_ANALYSIS', 'PROGRAMMING'].includes(request.type) ? 8 : 5,
    answer:
      request.type === 'MULTIPLE_CHOICE'
        ? ['A', 'C']
        : request.type === 'TRUE_FALSE'
          ? '正确'
          : request.type === 'FILL_BLANK'
            ? topic
            : ['SHORT_ANSWER', 'ESSAY', 'CASE_ANALYSIS', 'PROGRAMMING'].includes(request.type)
              ? `参考答案需覆盖 ${topic} 的核心概念、应用场景和关键评分点。`
              : 'A',
    analysis: `本题围绕“${topic}”考查学生对概念、应用场景和易错点的理解，解析内容已按中文要求生成。`,
    options: isChoice ? buildOptions(index) : [],
    scoringPoints: ['SHORT_ANSWER', 'ESSAY', 'CASE_ANALYSIS', 'PROGRAMMING'].includes(request.type)
      ? buildScoringPoints(topic)
      : [],
    confidence,
    riskCodes: [...riskCodes],
    reviewStatus: 'PENDING',
    model: `${providerLabels[request.provider ?? 'OPENAI']}-LangGraph`,
    generatedAt: nowText(),
  };
};

const toServerGenerateRequest = (
  request: AiQuestionGenerateRequest,
): ServerAiQuestionGenerateRequest => ({
  courseId: request.courseId,
  provider: request.provider ?? 'OPENAI',
  prompt: request.subject || request.knowledgePoint || '请生成适用于课堂测验的中文题目',
  questionType: request.type,
  difficulty: request.difficulty,
  count: normalizeCount(request.count),
  knowledgePoint: request.knowledgePoint,
  requirement: request.requirement,
});

const toReviewStatus = (question: ServerQuestionResponse): AiReviewStatus => {
  if (question.status === 'ACTIVE') {
    return question.reviewAction === 'EDITED_ACCEPTED' ? 'EDITED_ACCEPTED' : 'ACCEPTED';
  }
  if (question.status === 'REJECTED') {
    return 'REJECTED';
  }
  return 'PENDING';
};

const toAiDraft = (question: ServerQuestionResponse): AiQuestionDraft => ({
  id: question.id,
  title: question.title,
  type: question.type,
  difficulty: question.difficulty,
  courseId: question.courseId,
  courseName: question.courseName,
  knowledgePoints: question.knowledgePoints ?? [],
  score: Number(question.score) || 0,
  answer: question.answer,
  analysis: question.analysis,
  options: question.options ?? [],
  scoringPoints: question.scoringPoints ?? [],
  confidence: 0.9,
  riskCodes: [],
  reviewStatus: toReviewStatus(question),
  model: 'AI-LangGraph',
  generatedAt: question.reviewedAt || question.updatedAt,
});

const draftStatusMatched = (draft: AiQuestionDraft, status: AiQuestionDraftFilterStatus) => {
  if (status === 'ALL') {
    return true;
  }
  if (status === 'REJECTED') {
    return draft.reviewStatus === 'REJECTED';
  }
  return draft.reviewStatus === 'PENDING';
};

export async function getAiProviderSetting(
  provider: AiProvider = 'OPENAI',
): Promise<AiProviderSetting> {
  if (!useMockApi) {
    return apiGet<AiProviderSetting>('/v1/ai/provider-settings', { provider });
  }

  return mockDelay({ ...mockProviderSettings[provider] });
}

export async function saveAiProviderSetting(
  request: AiProviderSettingRequest,
): Promise<AiProviderSetting> {
  if (!useMockApi) {
    return apiPut<AiProviderSetting, AiProviderSettingRequest>('/v1/ai/provider-settings', request);
  }

  const apiKey = request.apiKey?.trim() ?? '';
  const previous = mockProviderSettings[request.provider];
  mockProviderSettings = {
    ...mockProviderSettings,
    [request.provider]: {
      provider: request.provider,
      providerLabel: providerLabels[request.provider],
      configured: Boolean(apiKey) || previous.configured,
      keyPreview: apiKey ? `****${apiKey.slice(-6)}` : (previous.keyPreview ?? null),
      baseUrl: request.baseUrl.trim() || providerDefaults[request.provider].baseUrl,
      model: request.model.trim() || providerDefaults[request.provider].model,
      updatedAt: nowText(),
    },
  };

  return mockDelay({ ...mockProviderSettings[request.provider] });
}

export async function testAiProviderConnection(
  request: AiProviderConnectionTestRequest,
): Promise<AiProviderConnectionTestResponse> {
  if (!useMockApi) {
    return apiPost<AiProviderConnectionTestResponse, AiProviderConnectionTestRequest>(
      '/v1/ai/provider-settings/test',
      request,
      { timeout: AI_CONNECTION_TEST_TIMEOUT_MS },
    );
  }

  const hasKey =
    Boolean(request.apiKey?.trim()) || mockProviderSettings[request.provider].configured;
  return mockDelay({
    success: hasKey,
    provider: request.provider,
    providerLabel: providerLabels[request.provider],
    baseUrl: request.baseUrl.trim() || providerDefaults[request.provider].baseUrl,
    model: request.model.trim() || providerDefaults[request.provider].model,
    latencyMs: hasKey ? 328 : 0,
    message: hasKey ? 'Mock 连接测试成功' : 'Mock：请先填写或保存 API Key',
    responsePreview: hasKey ? '连接成功' : null,
    testedAt: nowIso(),
  });
}

export async function listAiQuestionDrafts(
  status: AiQuestionDraftFilterStatus = 'PENDING_REVIEW',
): Promise<AiQuestionDraft[]> {
  const page = await listAiQuestionDraftsPage(status, 1, 100);

  return page.items;
}

export async function listAiQuestionDraftsPage(
  status: AiQuestionDraftFilterStatus = 'PENDING_REVIEW',
  page = 1,
  pageSize = 10,
): Promise<PageResponse<AiQuestionDraft>> {
  if (!useMockApi) {
    const params: Record<string, unknown> = {
      page,
      pageSize,
      source: 'AI',
    };
    if (status !== 'ALL') {
      params.status = status;
    }
    const response = await apiGet<PageResponse<ServerQuestionResponse>>('/v1/questions', params);

    return {
      ...response,
      items: response.items.map(toAiDraft),
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
  const filtered = aiDrafts.filter((draft) => draftStatusMatched(draft, status));
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: filtered.slice(start, start + safePageSize).map((draft) => ({ ...draft })),
    total: filtered.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function createAiQuestionGenerationTask(
  request: AiQuestionGenerateRequest,
): Promise<AiQuestionGenerationTask> {
  if (!useMockApi) {
    return apiPost<AiQuestionGenerationTask, ServerAiQuestionGenerateRequest>(
      '/v1/ai/questions/generation-tasks',
      toServerGenerateRequest(request),
      { timeout: 12000 },
    );
  }

  const count = normalizeCount(request.count);
  const generated = Array.from({ length: count }, (_, index) =>
    createGeneratedDraft(request, index + 1),
  );
  aiDrafts = [...generated, ...aiDrafts];

  const task: AiQuestionGenerationTaskListItem = {
    id: `mock-ai-question-task-${Date.now()}`,
    status: 'SUCCEEDED',
    provider: request.provider ?? 'OPENAI',
    courseId: request.courseId,
    courseName: request.subject,
    prompt: request.subject,
    questionType: request.type,
    difficulty: request.difficulty,
    count,
    knowledgePoint: request.knowledgePoint,
    requirement: request.requirement,
    teacherName: 'Mock 教师',
    generatedCount: generated.length,
    generatedQuestionIds: generated.map((item) => item.id),
    errorMessage: null,
    requestedAt: nowIso(),
    startedAt: nowIso(),
    finishedAt: nowIso(),
    updatedAt: nowIso(),
  };
  mockTaskHistory = [task, ...mockTaskHistory];

  return mockDelay(task);
}

export async function getAiQuestionGenerationTask(
  taskId: string,
): Promise<AiQuestionGenerationTask> {
  if (!useMockApi) {
    return apiGet<AiQuestionGenerationTask>(`/v1/ai/questions/generation-tasks/${taskId}`);
  }

  const task = mockTaskHistory.find((item) => item.id === taskId);
  if (task) {
    return mockDelay({ ...task });
  }

  return mockDelay({
    id: taskId,
    status: 'SUCCEEDED',
    provider: 'OPENAI',
    courseId: '',
    generatedCount: aiDrafts.length,
    generatedQuestionIds: aiDrafts.map((draft) => draft.id),
    errorMessage: null,
    requestedAt: nowIso(),
    startedAt: nowIso(),
    finishedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function waitAiQuestionGenerationTask(
  taskId: string,
  onProgress?: (task: AiQuestionGenerationTask) => void,
): Promise<AiQuestionGenerationTask> {
  const startedAt = Date.now();
  let task = await getAiQuestionGenerationTask(taskId);
  onProgress?.(task);

  while (task.status === 'PENDING' || task.status === 'RUNNING') {
    if (Date.now() - startedAt > AI_QUESTION_TASK_MAX_WAIT_MS) {
      throw new Error('AI 生成任务仍在后台运行，请稍后刷新待审核题目或重新进入页面查看结果。');
    }
    await sleep(AI_QUESTION_TASK_POLL_INTERVAL_MS);
    task = await getAiQuestionGenerationTask(taskId);
    onProgress?.(task);
  }

  if (task.status === 'FAILED') {
    throw new Error(task.errorMessage || 'AI 题目生成任务失败，请检查 Provider 配置或稍后重试。');
  }

  return task;
}

export async function listAiQuestionGenerationTasks(
  page = 1,
  pageSize = 10,
): Promise<PageResponse<AiQuestionGenerationTaskListItem>> {
  if (!useMockApi) {
    return apiGet<PageResponse<AiQuestionGenerationTaskListItem>>(
      '/v1/ai/questions/generation-tasks',
      {
        page,
        pageSize,
      },
    );
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: mockTaskHistory.slice(start, start + safePageSize).map((task) => ({ ...task })),
    total: mockTaskHistory.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function generateAiQuestions(
  request: AiQuestionGenerateRequest,
): Promise<AiQuestionDraft[]> {
  if (!useMockApi) {
    const task = await createAiQuestionGenerationTask(request);
    await waitAiQuestionGenerationTask(task.id);
    return listAiQuestionDrafts();
  }

  await createAiQuestionGenerationTask(request);
  return listAiQuestionDrafts();
}

export async function reviewAiQuestion(
  id: string,
  status: AiReviewStatus,
): Promise<AiQuestionDraft[]> {
  if (!useMockApi) {
    if (status !== 'PENDING') {
      await apiPost<ServerQuestionResponse, { action: Exclude<AiReviewStatus, 'PENDING'> }>(
        `/v1/questions/${id}/review`,
        { action: status },
      );
    }

    return listAiQuestionDrafts();
  }

  aiDrafts = aiDrafts.map((draft) =>
    draft.id === id ? { ...draft, reviewStatus: status } : draft,
  );

  return mockDelay(aiDrafts.filter((draft) => draft.reviewStatus === 'PENDING'));
}
