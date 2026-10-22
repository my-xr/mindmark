from pathlib import Path
# repo
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/repository/PaperQuestionRepository.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('public interface PaperQuestionRepository extends JpaRepository<PaperQuestionEntity, String> {\n}', 'public interface PaperQuestionRepository extends JpaRepository<PaperQuestionEntity, String> {\n\n    long countByQuestion_Id(String questionId);\n}')
p.write_text(text,encoding='utf-8')
# service
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('import com.mindmark.server.modules.question.dto.QuestionResponse;\n', 'import com.mindmark.server.modules.question.dto.QuestionDeleteResponse;\nimport com.mindmark.server.modules.question.dto.QuestionResponse;\n')
text=text.replace('import com.mindmark.server.modules.question.repository.QuestionRepository;\n', 'import com.mindmark.server.modules.question.repository.QuestionRepository;\nimport com.mindmark.server.modules.paper.repository.PaperQuestionRepository;\n')
text=text.replace('    private final CourseRepository courseRepository;\n', '    private final CourseRepository courseRepository;\n    private final PaperQuestionRepository paperQuestionRepository;\n')
text=text.replace('        CourseRepository courseRepository,\n        QuestionResponseMapper responseMapper,', '        CourseRepository courseRepository,\n        PaperQuestionRepository paperQuestionRepository,\n        QuestionResponseMapper responseMapper,')
text=text.replace('        this.courseRepository = courseRepository;\n        this.responseMapper = responseMapper;', '        this.courseRepository = courseRepository;\n        this.paperQuestionRepository = paperQuestionRepository;\n        this.responseMapper = responseMapper;')
marker='''    @Transactional\n    public QuestionResponse updateQuestion(String questionId, QuestionCreateRequest request, AuthUserEntity editor) {'''
insert='''    @Transactional\n    public QuestionDeleteResponse deleteQuestion(String questionId, AuthUserEntity operator) {\n        QuestionEntity entity = questionRepository.findById(normalize(questionId))\n            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));\n        long referenceCount = paperQuestionRepository.countByQuestion_Id(entity.getId());\n        if (referenceCount > 0) {\n            entity.setStatus(QuestionStatus.DISABLED);\n            entity.setUpdatedAt(OffsetDateTime.now());\n            QuestionEntity saved = questionRepository.save(entity);\n            authAuditService.record(\n                operator.getId(),\n                "QUESTION_DISABLE",\n                saved.getId(),\n                "SUCCESS",\n                "references=" + referenceCount\n            );\n            return new QuestionDeleteResponse(\n                saved.getId(),\n                false,\n                saved.getStatus(),\n                "题目已被试卷引用，已停用并保留历史记录。"\n            );\n        }\n\n        questionRepository.delete(entity);\n        authAuditService.record(\n            operator.getId(),\n            "QUESTION_DELETE",\n            entity.getId(),\n            "SUCCESS",\n            "physical=true"\n        );\n        return new QuestionDeleteResponse(entity.getId(), true, null, "题目已删除。");\n    }\n\n'''
text=text.replace(marker, insert+marker)
p.write_text(text,encoding='utf-8')
# controller
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('import com.mindmark.server.modules.question.dto.QuestionQuery;\n', 'import com.mindmark.server.modules.question.dto.QuestionDeleteResponse;\nimport com.mindmark.server.modules.question.dto.QuestionQuery;\n')
text=text.replace('import org.springframework.web.bind.annotation.GetMapping;\n', 'import org.springframework.web.bind.annotation.DeleteMapping;\nimport org.springframework.web.bind.annotation.GetMapping;\n')
marker='''    @PutMapping("/{questionId}")\n    public ApiResponse<QuestionResponse> updateQuestion('''
insert='''    @DeleteMapping("/{questionId}")\n    public ApiResponse<QuestionDeleteResponse> deleteQuestion(\n        @RequestHeader(value = "Authorization", required = false) String authorization,\n        @PathVariable String questionId\n    ) {\n        AuthUserEntity teacher = requireQuestionWriteRole(authorization);\n        return ApiResponse.success(questionWriteService.deleteQuestion(questionId, teacher));\n    }\n\n'''
text=text.replace(marker, insert+marker)
p.write_text(text,encoding='utf-8')
