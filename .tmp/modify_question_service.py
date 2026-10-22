from pathlib import Path
p=Path('apps/mindmark-web/src/services/questionService.ts')
text=p.read_text(encoding='utf-8-sig')
text=text.replace("import { apiGet, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';", "import { apiDelete, apiGet, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';")
text=text.replace("export interface QuestionUpsertRequest {\n", "export interface QuestionDeleteResponse {\n  id: string;\n  physicallyDeleted: boolean;\n  status?: Question['status'] | null;\n  message: string;\n}\n\nexport interface QuestionUpsertRequest {\n")
append="""

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
"""
if 'export async function deleteQuestion' not in text:
    text += append
p.write_text(text,encoding='utf-8')
