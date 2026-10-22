const fs=require('fs');
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java';
let s=fs.readFileSync(p,'utf8');
const method=`
    @Transactional
    public QuestionResponse updateQuestion(String questionId, QuestionCreateRequest request, AuthUserEntity editor) {
        validateRequest(request);
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        CourseEntity course = courseRepository.findById(normalize(request.courseId()))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));

        entity.setTitle(required(request.title(), "title"));
        entity.setType(request.type());
        entity.setDifficulty(request.difficulty());
        entity.setCourseId(course.getId());
        entity.setCourseName(course.getName());
        entity.setKnowledgePoints(normalizeKnowledgePoints(request.knowledgePoints()));
        entity.setScore(request.score() == null ? DEFAULT_SCORE : request.score());
        entity.setAnswerJson(toJson(request.answer(), "answer"));
        entity.setAnalysis(required(request.analysis(), "analysis"));
        entity.setOptionsJson(toJson(request.options(), "options"));
        entity.setScoringPointsJson(toJson(request.scoringPoints(), "scoringPoints"));
        if (entity.getSource() == QuestionSource.AI && entity.getStatus() == QuestionStatus.REJECTED) {
            entity.setStatus(QuestionStatus.PENDING_REVIEW);
            entity.setReviewAction(null);
            entity.setReviewComment("Rejected AI question edited and resubmitted for review");
            entity.setReviewedBy(null);
            entity.setReviewedAt(null);
        }
        entity.setUpdatedAt(OffsetDateTime.now());

        QuestionEntity saved = questionRepository.save(entity);
        authAuditService.record(
            editor.getId(),
            "QUESTION_UPDATE",
            saved.getId(),
            "SUCCESS",
            "source=" + saved.getSource() + ", status=" + saved.getStatus()
        );
        return responseMapper.toResponse(saved);
    }
`;
if(!s.includes('QuestionResponse updateQuestion')) {
  s=s.replace('\n    private QuestionEntity createQuestion(', method+'\n    private QuestionEntity createQuestion(');
}
fs.writeFileSync(p,s,'utf8');

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java';
s=fs.readFileSync(p,'utf8');
if(!s.includes('import org.springframework.web.bind.annotation.PutMapping;')) s=s.replace('import org.springframework.web.bind.annotation.PostMapping;\n', 'import org.springframework.web.bind.annotation.PostMapping;\nimport org.springframework.web.bind.annotation.PutMapping;\n');
const ctrl=`
    @PutMapping("/{questionId}")
    public ApiResponse<QuestionResponse> updateQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String questionId,
        @RequestBody QuestionCreateRequest request
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.updateQuestion(questionId, request, teacher));
    }
`;
if(!s.includes('updateQuestion(')) {
  s=s.replace('\n    @PostMapping("/import")', ctrl+'\n    @PostMapping("/import")');
}
fs.writeFileSync(p,s,'utf8');
