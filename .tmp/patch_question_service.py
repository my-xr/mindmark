from pathlib import Path
p=Path('apps/mindmark-web/src/services/questionService.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("import { apiDelete, apiGet, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';", "import { apiDelete, apiGet, apiPost, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';")
insert = r'''
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

'''
marker='export async function updateQuestion('
s=s.replace(marker, insert+marker)
p.write_text(s, encoding='utf-8')
