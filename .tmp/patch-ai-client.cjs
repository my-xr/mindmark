const fs = require('fs');
const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s = fs.readFileSync(p, 'utf8');
const old = `    public List<QuestionCreateRequest> generate(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String basePrompt = buildPrompt(course, request);
        String prompt = basePrompt;
        BusinessException lastRetryableException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            String content = callQuestionProviderWithRetry(config, prompt);
            try {
                return parseQuestions(content, request);
            } catch (BusinessException exception) {
                if (!isRetryableGenerationFailure(exception) || attempt == 3) {
                    throw exception;
                }
                lastRetryableException = exception;
                prompt = basePrompt + retryInstruction(exception, attempt + 1);
            }
        }
        throw lastRetryableException == null
            ? new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question generation failed")
            : lastRetryableException;
    }`;
if (!s.includes(old)) {
  console.error('old block not found');
  process.exit(1);
}
const rep = `    public List<QuestionCreateRequest> generate(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        int count = normalizeCount(request.count());
        if (count == 1) {
            return generateOneBatch(config, course, withCount(request, 1));
        }

        java.util.ArrayList<QuestionCreateRequest> generated = new java.util.ArrayList<>();
        for (int index = 1; index <= count; index += 1) {
            AiQuestionGenerateRequest singleRequest = withSingleQuestionRequirement(request, index, count);
            List<QuestionCreateRequest> batch = generateOneBatch(config, course, singleRequest);
            if (batch.isEmpty()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty questions array");
            }
            generated.add(batch.getFirst());
        }
        return List.copyOf(generated);
    }

    private List<QuestionCreateRequest> generateOneBatch(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String basePrompt = buildPrompt(course, request);
        String prompt = basePrompt;
        BusinessException lastRetryableException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            String content = callQuestionProviderWithRetry(config, prompt);
            try {
                List<QuestionCreateRequest> questions = parseQuestions(content, request);
                if (questions.isEmpty()) {
                    throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty questions array");
                }
                return questions;
            } catch (BusinessException exception) {
                if (!isRetryableGenerationFailure(exception) || attempt == 3) {
                    throw exception;
                }
                lastRetryableException = exception;
                prompt = basePrompt + retryInstruction(exception, attempt + 1);
            }
        }
        throw lastRetryableException == null
            ? new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question generation failed")
            : lastRetryableException;
    }`;
s = s.replace(old, rep);
const marker = '    public String testConnection';
const helpers = `    private int normalizeCount(Integer count) {
        int normalized = count == null ? 1 : count;
        if (normalized < 1 || normalized > 5) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "count must be between 1 and 5");
        }
        return normalized;
    }

    private AiQuestionGenerateRequest withCount(AiQuestionGenerateRequest request, int count) {
        return new AiQuestionGenerateRequest(
            request.courseId(),
            request.provider(),
            request.prompt(),
            request.questionType(),
            request.difficulty(),
            count,
            request.knowledgePoint(),
            request.requirement()
        );
    }

    private AiQuestionGenerateRequest withSingleQuestionRequirement(AiQuestionGenerateRequest request, int index, int total) {
        String requirement = safe(request.requirement())
            + "\n请只生成 1 道题，这是本次任务的第 " + index + "/" + total
            + " 道。题干、选项和解析必须与本批次其他题有明显差异，避免重复。";
        return new AiQuestionGenerateRequest(
            request.courseId(),
            request.provider(),
            request.prompt(),
            request.questionType(),
            request.difficulty(),
            1,
            request.knowledgePoint(),
            requirement
        );
    }

`;
if (!s.includes(marker)) {
  console.error('marker not found');
  process.exit(1);
}
s = s.replace(marker, helpers + marker);
fs.writeFileSync(p, s, 'utf8');
