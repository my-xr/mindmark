const fs=require('fs');
const p='apps/mindmark-web/src/services/questionService.ts';
let s=fs.readFileSync(p,'utf8');
s=s.replace("import { apiGet, type PageResponse, useMockApi } from '@/services/api/httpClient';", "import { apiGet, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';");
s=s.replace("import type { Question, QuestionQuery } from '@/types/question';", "import type { Question, QuestionOption, QuestionQuery, ScoringPoint } from '@/types/question';");
s=s.replace(`const mockDelay = <T>(data: T, timeout = 240) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });`, `const mockDelay = <T>(data: T, timeout = 240) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let questionStore: Question[] = mockQuestions.map((question) => ({ ...question }));`);
s=s.replace(`const toQueryParams = (query: QuestionQuery): Record<string, unknown> => {
  const params: Record<string, unknown> = { page: 1, pageSize: 100 };`, `const toQueryParams = (query: QuestionQuery): Record<string, unknown> => {
  const params: Record<string, unknown> = { page: query.page ?? 1, pageSize: query.pageSize ?? 100 };`);
const oldList=`export async function listQuestions(query: QuestionQuery = {}): Promise<Question[]> {
  if (!useMockApi) {
    const page = await apiGet<PageResponse<Question>>('/v1/questions', toQueryParams(query));

    return page.items;
  }

  const keyword = normalizeKeyword(query.keyword);

  const questions = mockQuestions.filter((question) => {
    const typeMatched = !query.type || query.type === 'ALL' || question.type === query.type;
    const difficultyMatched =
      !query.difficulty || query.difficulty === 'ALL' || question.difficulty === query.difficulty;
    const statusMatched =
      !query.status || query.status === 'ALL' || question.status === query.status;
    const sourceMatched =
      !query.source || query.source === 'ALL' || question.source === query.source;
    const courseMatched =
      !query.courseId || query.courseId === 'ALL' || question.courseId === query.courseId;

    return (
      typeMatched &&
      difficultyMatched &&
      statusMatched &&
      sourceMatched &&
      courseMatched &&
      matchesKeyword(question, keyword)
    );
  });

  return mockDelay([...questions]);
}`;
const newList=`export interface QuestionUpsertRequest {
  courseId: string;
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

const filterQuestions = (query: QuestionQuery = {}) => {
  const keyword = normalizeKeyword(query.keyword);

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

    return (
      typeMatched &&
      difficultyMatched &&
      statusMatched &&
      sourceMatched &&
      courseMatched &&
      matchesKeyword(question, keyword)
    );
  });
};

export async function listQuestionsPage(query: QuestionQuery = {}): Promise<PageResponse<Question>> {
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
  const page = await listQuestionsPage({ ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 100 });

  return page.items;
}`;
if(!s.includes(oldList)){console.error('list block not found'); process.exit(1)}
s=s.replace(oldList,newList);
s=s.replace(`  return mockDelay(mockQuestions.find((question) => question.id === id));
}`, `  return mockDelay(questionStore.find((question) => question.id === id));
}

export async function updateQuestion(
  id: string,
  request: QuestionUpsertRequest,
): Promise<Question> {
  if (!useMockApi) {
    return apiPut<Question, QuestionUpsertRequest>(\`/v1/questions/\${id}\`, request);
  }

  const index = questionStore.findIndex((question) => question.id === id);
  if (index < 0) {
    throw new Error('题目不存在');
  }

  const previous = questionStore[index];
  const now = new Date();
  const updatedAt = \`${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(
    now.getDate(),
  ).padStart(2, '0')} \${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;
  const next: Question = {
    ...previous,
    ...request,
    courseName: previous.courseName,
    status: previous.source === 'AI' && previous.status === 'REJECTED' ? 'PENDING_REVIEW' : previous.status,
    updatedAt,
  };
  questionStore = questionStore.map((question) => (question.id === id ? next : question));

  return mockDelay({ ...next });
}`);
fs.writeFileSync(p,s,'utf8');
