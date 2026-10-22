const fs = require('fs');
const path = require('path');
const root = process.cwd();
function p(rel){ return path.join(root, rel); }
function read(rel){ return fs.readFileSync(p(rel), 'utf8'); }
function write(rel, content){ fs.mkdirSync(path.dirname(p(rel)), { recursive: true }); fs.writeFileSync(p(rel), content, 'utf8'); }
function replace(rel, oldText, newText){
  const file = p(rel);
  const content = fs.readFileSync(file, 'utf8');
  if(!content.includes(oldText)){
    throw new Error(`Pattern not found in ${rel}: ${oldText.slice(0, 120)}`);
  }
  fs.writeFileSync(file, content.replace(oldText, newText), 'utf8');
}

write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionReviewAction.java', `package com.mindmark.server.modules.question.domain;\n\npublic enum QuestionReviewAction {\n    ACCEPTED,\n    EDITED_ACCEPTED,\n    REJECTED\n}\n`);

write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/dto/QuestionReviewRequest.java', `package com.mindmark.server.modules.question.dto;\n\nimport com.mindmark.server.modules.question.domain.QuestionReviewAction;\n\npublic record QuestionReviewRequest(\n    QuestionReviewAction action,\n    String comment\n) {\n}\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionEntity.java',
`    @Column(name = "created_by", nullable = false, length = 64)\n    private String createdBy;\n\n    @Column(name = "updated_at", nullable = false)\n    private OffsetDateTime updatedAt;\n`,
`    @Column(name = "created_by", nullable = false, length = 64)\n    private String createdBy;\n\n    @Column(name = "reviewed_by", length = 64)\n    private String reviewedBy;\n\n    @Column(name = "reviewed_at")\n    private OffsetDateTime reviewedAt;\n\n    @Column(name = "review_comment", columnDefinition = "text")\n    private String reviewComment;\n\n    @Enumerated(EnumType.STRING)\n    @Column(name = "review_action", length = 32)\n    private QuestionReviewAction reviewAction;\n\n    @Column(name = "updated_at", nullable = false)\n    private OffsetDateTime updatedAt;\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionEntity.java',
`    public String getCreatedBy() {\n        return createdBy;\n    }\n\n    public void setCreatedBy(String createdBy) {\n        this.createdBy = createdBy;\n    }\n\n    public OffsetDateTime getUpdatedAt() {\n        return updatedAt;\n    }\n`,
`    public String getCreatedBy() {\n        return createdBy;\n    }\n\n    public void setCreatedBy(String createdBy) {\n        this.createdBy = createdBy;\n    }\n\n    public String getReviewedBy() {\n        return reviewedBy;\n    }\n\n    public void setReviewedBy(String reviewedBy) {\n        this.reviewedBy = reviewedBy;\n    }\n\n    public OffsetDateTime getReviewedAt() {\n        return reviewedAt;\n    }\n\n    public void setReviewedAt(OffsetDateTime reviewedAt) {\n        this.reviewedAt = reviewedAt;\n    }\n\n    public String getReviewComment() {\n        return reviewComment;\n    }\n\n    public void setReviewComment(String reviewComment) {\n        this.reviewComment = reviewComment;\n    }\n\n    public QuestionReviewAction getReviewAction() {\n        return reviewAction;\n    }\n\n    public void setReviewAction(QuestionReviewAction reviewAction) {\n        this.reviewAction = reviewAction;\n    }\n\n    public OffsetDateTime getUpdatedAt() {\n        return updatedAt;\n    }\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/dto/QuestionResponse.java',
`import com.mindmark.server.modules.question.domain.QuestionSource;\n`,
`import com.mindmark.server.modules.question.domain.QuestionReviewAction;\nimport com.mindmark.server.modules.question.domain.QuestionSource;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/dto/QuestionResponse.java',
`    JsonNode scoringPoints,\n    String updatedAt,\n    String createdBy\n) {\n}\n`,
`    JsonNode scoringPoints,\n    String updatedAt,\n    String createdBy,\n    String reviewedBy,\n    String reviewedAt,\n    String reviewComment,\n    QuestionReviewAction reviewAction\n) {\n}\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionResponseMapper.java',
`            parseJson(entity.getScoringPointsJson()),\n            DATE_TIME_FORMATTER.format(entity.getUpdatedAt().atZoneSameInstant(ZoneId.systemDefault())),\n            entity.getCreatedBy()\n        );\n`,
`            parseJson(entity.getScoringPointsJson()),\n            formatDateTime(entity.getUpdatedAt()),\n            entity.getCreatedBy(),\n            entity.getReviewedBy(),\n            formatDateTime(entity.getReviewedAt()),\n            entity.getReviewComment(),\n            entity.getReviewAction()\n        );\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionResponseMapper.java',
`    private JsonNode parseJson(String value) {\n`,
`    private String formatDateTime(java.time.OffsetDateTime value) {\n        if (value == null) {\n            return null;\n        }\n        return DATE_TIME_FORMATTER.format(value.atZoneSameInstant(ZoneId.systemDefault()));\n    }\n\n    private JsonNode parseJson(String value) {\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`import com.mindmark.server.modules.ai.dto.QuestionImportResponse;\n`,
`import com.mindmark.server.modules.ai.dto.QuestionImportResponse;\nimport com.mindmark.server.modules.auth.domain.AuthUserEntity;\nimport com.mindmark.server.modules.auth.service.AuthAuditService;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`import com.mindmark.server.modules.question.domain.QuestionSource;\n`,
`import com.mindmark.server.modules.question.domain.QuestionReviewAction;\nimport com.mindmark.server.modules.question.domain.QuestionSource;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`import com.mindmark.server.modules.question.dto.QuestionResponse;\n`,
`import com.mindmark.server.modules.question.dto.QuestionResponse;\nimport com.mindmark.server.modules.question.dto.QuestionReviewRequest;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`    private final CourseRepository courseRepository;\n    private final QuestionResponseMapper responseMapper;\n    private final ObjectMapper objectMapper;\n`,
`    private final CourseRepository courseRepository;\n    private final QuestionResponseMapper responseMapper;\n    private final ObjectMapper objectMapper;\n    private final AuthAuditService authAuditService;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`        QuestionRepository questionRepository,\n        CourseRepository courseRepository,\n        QuestionResponseMapper responseMapper,\n        ObjectMapper objectMapper\n    ) {\n        this.questionRepository = questionRepository;\n        this.courseRepository = courseRepository;\n        this.responseMapper = responseMapper;\n        this.objectMapper = objectMapper;\n    }\n`,
`        QuestionRepository questionRepository,\n        CourseRepository courseRepository,\n        QuestionResponseMapper responseMapper,\n        ObjectMapper objectMapper,\n        AuthAuditService authAuditService\n    ) {\n        this.questionRepository = questionRepository;\n        this.courseRepository = courseRepository;\n        this.responseMapper = responseMapper;\n        this.objectMapper = objectMapper;\n        this.authAuditService = authAuditService;\n    }\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java',
`    @Transactional\n    public List<QuestionResponse> createAiQuestions(List<QuestionCreateRequest> generatedQuestions, String createdBy) {\n        return generatedQuestions.stream()\n            .map(item -> createQuestion(item, QuestionSource.AI, QuestionStatus.PENDING_REVIEW, createdBy))\n            .map(responseMapper::toResponse)\n            .toList();\n    }\n`,
`    @Transactional\n    public List<QuestionResponse> createAiQuestions(List<QuestionCreateRequest> generatedQuestions, String createdBy) {\n        return generatedQuestions.stream()\n            .map(item -> createQuestion(item, QuestionSource.AI, QuestionStatus.PENDING_REVIEW, createdBy))\n            .map(responseMapper::toResponse)\n            .toList();\n    }\n\n    @Transactional\n    public QuestionResponse reviewAiQuestion(String questionId, QuestionReviewRequest request, AuthUserEntity reviewer) {\n        if (request == null || request.action() == null) {\n            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "review action is required");\n        }\n        QuestionEntity question = questionRepository.findById(required(questionId, "questionId"))\n            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));\n        if (question.getSource() != QuestionSource.AI) {\n            throw new BusinessException(ErrorCode.CONFLICT, "Only AI generated questions can be reviewed here");\n        }\n        if (question.getStatus() != QuestionStatus.PENDING_REVIEW) {\n            throw new BusinessException(ErrorCode.CONFLICT, "Only PENDING_REVIEW questions can be reviewed");\n        }\n\n        OffsetDateTime now = OffsetDateTime.now();\n        QuestionReviewAction action = request.action();\n        question.setStatus(action == QuestionReviewAction.REJECTED ? QuestionStatus.DISABLED : QuestionStatus.ACTIVE);\n        question.setReviewedBy(reviewer.getId());\n        question.setReviewedAt(now);\n        question.setReviewAction(action);\n        question.setReviewComment(normalize(request.comment()));\n        question.setUpdatedAt(now);\n\n        QuestionEntity saved = questionRepository.save(question);\n        authAuditService.record(\n            reviewer.getId(),\n            "AI_QUESTION_REVIEW",\n            saved.getId(),\n            "SUCCESS",\n            "action=" + action + ", status=" + saved.getStatus()\n                + (normalize(request.comment()) == null ? "" : ", comment=" + normalize(request.comment()))\n        );\n        return responseMapper.toResponse(saved);\n    }\n`);

replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java',
`import com.mindmark.server.modules.question.dto.QuestionResponse;\n`,
`import com.mindmark.server.modules.question.dto.QuestionResponse;\nimport com.mindmark.server.modules.question.dto.QuestionReviewRequest;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java',
`import org.springframework.web.bind.annotation.GetMapping;\n`,
`import org.springframework.web.bind.annotation.GetMapping;\nimport org.springframework.web.bind.annotation.PathVariable;\n`);
replace('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java',
`    @PostMapping("/import")\n    public ApiResponse<QuestionImportResponse> importQuestions(\n        @RequestHeader(value = "Authorization", required = false) String authorization,\n        @RequestBody QuestionImportRequest request\n    ) {\n        AuthUserEntity teacher = requireQuestionWriteRole(authorization);\n        return ApiResponse.success(questionWriteService.importQuestions(request, teacher.getName()));\n    }\n`,
`    @PostMapping("/import")\n    public ApiResponse<QuestionImportResponse> importQuestions(\n        @RequestHeader(value = "Authorization", required = false) String authorization,\n        @RequestBody QuestionImportRequest request\n    ) {\n        AuthUserEntity teacher = requireQuestionWriteRole(authorization);\n        return ApiResponse.success(questionWriteService.importQuestions(request, teacher.getName()));\n    }\n\n    @PostMapping("/{questionId}/review")\n    public ApiResponse<QuestionResponse> reviewAiQuestion(\n        @RequestHeader(value = "Authorization", required = false) String authorization,\n        @PathVariable String questionId,\n        @RequestBody QuestionReviewRequest request\n    ) {\n        AuthUserEntity teacher = requireQuestionWriteRole(authorization);\n        return ApiResponse.success(questionWriteService.reviewAiQuestion(questionId, request, teacher));\n    }\n`);
