from pathlib import Path

# 1) PaperQuestionRepository add methods
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/repository/PaperQuestionRepository.java')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;\nimport java.util.List;', 'import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;\nimport com.mindmark.server.modules.paper.domain.PaperStatus;\nimport java.util.Collection;\nimport java.util.List;')
s = s.replace('    long countByQuestion_Id(String questionId);\n\n    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);', '    long countByQuestion_Id(String questionId);\n\n    long countByQuestion_IdAndPaper_StatusIn(String questionId, Collection<PaperStatus> statuses);\n\n    List<PaperQuestionEntity> findByQuestion_Id(String questionId);\n\n    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);')
p.write_text(s, encoding='utf-8')

# 2) QuestionWriteService delete behavior
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionWriteService.java')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('import com.mindmark.server.modules.question.repository.QuestionRepository;\nimport com.mindmark.server.modules.paper.repository.PaperQuestionRepository;', 'import com.mindmark.server.modules.question.repository.QuestionRepository;\nimport com.mindmark.server.modules.paper.domain.PaperEntity;\nimport com.mindmark.server.modules.paper.domain.PaperQuestionEntity;\nimport com.mindmark.server.modules.paper.domain.PaperStatus;\nimport com.mindmark.server.modules.paper.repository.PaperQuestionRepository;')
old = '''    @Transactional
    public QuestionDeleteResponse deleteQuestion(String questionId, AuthUserEntity operator) {
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        long referenceCount = paperQuestionRepository.countByQuestion_Id(entity.getId());
        if (referenceCount > 0) {
            entity.setStatus(QuestionStatus.DISABLED);
            entity.setUpdatedAt(OffsetDateTime.now());
            QuestionEntity saved = questionRepository.save(entity);
            authAuditService.record(
                operator.getId(),
                "QUESTION_DISABLE",
                saved.getId(),
                "SUCCESS",
                "references=" + referenceCount
            );
            return new QuestionDeleteResponse(
                saved.getId(),
                false,
                saved.getStatus(),
                "题目已被试卷引用，已停用并保留历史记录。"
            );
        }

        questionRepository.delete(entity);
        authAuditService.record(
            operator.getId(),
            "QUESTION_DELETE",
            entity.getId(),
            "SUCCESS",
            "physical=true"
        );
        return new QuestionDeleteResponse(entity.getId(), true, null, "题目已删除。");
    }
'''
new = '''    @Transactional
    public QuestionDeleteResponse deleteQuestion(String questionId, AuthUserEntity operator) {
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        List<PaperQuestionEntity> references = paperQuestionRepository.findByQuestion_Id(entity.getId());
        long lockedReferenceCount = paperQuestionRepository.countByQuestion_IdAndPaper_StatusIn(
            entity.getId(),
            Set.of(PaperStatus.PUBLISHED, PaperStatus.ARCHIVED)
        );

        if (lockedReferenceCount > 0) {
            int removedEditableReferences = removeEditablePaperReferences(references);
            entity.setStatus(QuestionStatus.DISABLED);
            entity.setUpdatedAt(OffsetDateTime.now());
            QuestionEntity saved = questionRepository.save(entity);
            authAuditService.record(
                operator.getId(),
                "QUESTION_DISABLE",
                saved.getId(),
                "SUCCESS",
                "lockedReferences=" + lockedReferenceCount + ", removedEditableReferences=" + removedEditableReferences
            );
            return new QuestionDeleteResponse(
                saved.getId(),
                false,
                saved.getStatus(),
                removedEditableReferences > 0
                    ? "题目已从未锁定试卷中移除；因仍存在已发布/归档试卷引用，系统已停用题目并保留历史记录。"
                    : "题目已被已发布/归档试卷引用，系统已停用题目并保留历史记录。"
            );
        }

        int removedReferences = removeEditablePaperReferences(references);
        questionRepository.delete(entity);
        authAuditService.record(
            operator.getId(),
            "QUESTION_DELETE",
            entity.getId(),
            "SUCCESS",
            "physical=true, removedPaperReferences=" + removedReferences
        );
        return new QuestionDeleteResponse(
            entity.getId(),
            true,
            null,
            removedReferences > 0 ? "题目及其未锁定试卷引用已删除。" : "题目已删除。"
        );
    }

    private int removeEditablePaperReferences(List<PaperQuestionEntity> references) {
        if (references.isEmpty()) {
            return 0;
        }

        Set<String> affectedPaperIds = new LinkedHashSet<>();
        int removed = 0;
        for (PaperQuestionEntity reference : references) {
            PaperEntity paper = reference.getPaper();
            if (paper.getStatus() == PaperStatus.PUBLISHED || paper.getStatus() == PaperStatus.ARCHIVED) {
                continue;
            }
            affectedPaperIds.add(paper.getId());
            paperQuestionRepository.delete(reference);
            removed += 1;
        }
        paperQuestionRepository.flush();

        for (String paperId : affectedPaperIds) {
            List<PaperQuestionEntity> remaining = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId);
            if (remaining.isEmpty()) {
                continue;
            }
            PaperEntity paper = remaining.get(0).getPaper();
            BigDecimal totalScore = BigDecimal.ZERO;
            for (int index = 0; index < remaining.size(); index += 1) {
                PaperQuestionEntity item = remaining.get(index);
                item.setOrderIndex(index + 1);
                totalScore = totalScore.add(item.getScore());
            }
            paper.setTotalScore(totalScore);
            paper.setUpdatedAt(OffsetDateTime.now());
            paperQuestionRepository.saveAll(remaining);
        }

        return removed;
    }
'''
if old not in s:
    raise SystemExit('delete block not found')
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

# 3) StudentAccountService Chinese errors
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/auth/service/StudentAccountService.java')
s = p.read_text(encoding='utf-8-sig')
repls = {
    '"classId is required"': '"教学班不能为空"',
    '"students must not be empty"': '"学生名单不能为空"',
    '"Student number and name are required"': '"学号和姓名不能为空"',
    '"Student number must contain at least 6 characters for initial password"': '"学号至少需要 6 位，才能生成初始密码"',
    '"Roster import task not found"': '"学生名单导入任务不存在"',
    '"Student profile not found"': '"学生档案不存在"',
    '"Student account not found"': '"学生账号不存在"',
    '"Student number is invalid for password reset"': '"学生学号不足 6 位，无法重置为默认密码"',
}
for a, b in repls.items():
    s = s.replace(a, b)
p.write_text(s, encoding='utf-8')
