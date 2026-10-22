from pathlib import Path

p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionService.java')
s = p.read_text(encoding='utf-8')
if 'import com.mindmark.server.common.api.ErrorCode;' not in s:
    s = s.replace(
        'import com.mindmark.server.common.api.PageResponse;\n',
        'import com.mindmark.server.common.api.ErrorCode;\nimport com.mindmark.server.common.api.PageResponse;\nimport com.mindmark.server.common.exception.BusinessException;\n',
    )
if 'public QuestionResponse getQuestion' not in s:
    marker = '    @Transactional(readOnly = true)\n    public PageResponse<QuestionResponse> listQuestions(QuestionQuery query) {'
    insert = '''    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(String questionId) {
        return questionRepository.findById(normalizeId(questionId))
            .map(responseMapper::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
    }

'''
    s = s.replace(marker, insert + marker)
if 'private String normalizeId' not in s:
    s = s.replace(
        '''    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
''',
        '''    private String normalizeId(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
''',
    )
old = '''                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("createdBy")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(knowledgePointJoin), keyword)
'''
new = '''                    criteriaBuilder.like(criteriaBuilder.lower(root.get("id")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("courseName")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("createdBy")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(knowledgePointJoin), keyword)
'''
if old in s:
    s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java')
s = p.read_text(encoding='utf-8')
if '@GetMapping("/{questionId}")' not in s:
    marker = '    @PostMapping\n    public ApiResponse<QuestionResponse> createQuestion('
    insert = '''    @GetMapping("/{questionId}")
    public ApiResponse<QuestionResponse> getQuestion(@PathVariable String questionId) {
        return ApiResponse.success(questionService.getQuestion(questionId));
    }

'''
    s = s.replace(marker, insert + marker)
p.write_text(s, encoding='utf-8')

p = Path('apps/mindmark-web/src/services/questionService.ts')
s = p.read_text(encoding='utf-8')
s = s.replace(
    '''  return [
    question.title,
    question.createdBy,
    question.courseName ?? '',
''',
    '''  return [
    question.id,
    question.title,
    question.createdBy,
    question.courseName ?? '',
''',
)
s = s.replace(
    '''export async function getQuestionById(id: string): Promise<Question | undefined> {
  if (!useMockApi) {
    const questions = await listQuestions();

    return questions.find((question) => question.id === id);
  }

  return mockDelay(questionStore.find((question) => question.id === id));
}
''',
    '''export async function getQuestionById(id: string): Promise<Question | undefined> {
  if (!useMockApi) {
    return apiGet<Question>(`/v1/questions/${id}`);
  }

  return mockDelay(questionStore.find((question) => question.id === id));
}
''',
)
p.write_text(s, encoding='utf-8')
