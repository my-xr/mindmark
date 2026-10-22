from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java')
text = p.read_text(encoding='utf-8')
text = text.replace('import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;\nimport com.mindmark.server.modules.auth.service.ClassScopeService;\n', 'import com.mindmark.server.modules.answer.repository.AnswerItemRepository;\nimport com.mindmark.server.modules.answer.repository.AnswerSheetRepository;\nimport com.mindmark.server.modules.auth.domain.AuthUserEntity;\nimport com.mindmark.server.modules.auth.domain.RoleCode;\nimport com.mindmark.server.modules.auth.service.ClassScopeService;\n')
text = text.replace('import com.mindmark.server.modules.grading.repository.GradingTaskRepository;\n', 'import com.mindmark.server.modules.grading.repository.GradingItemRepository;\nimport com.mindmark.server.modules.grading.repository.GradingTaskRepository;\n')
text = text.replace('import java.util.Map;\nimport org.springframework.stereotype.Service;\n', 'import java.util.Map;\nimport java.util.Set;\nimport org.springframework.data.domain.Page;\nimport org.springframework.data.domain.PageRequest;\nimport org.springframework.stereotype.Service;\n')
text = text.replace('    private final GradingTaskRepository gradingTaskRepository;\n    private final AnswerSheetRepository answerSheetRepository;\n', '    private final GradingTaskRepository gradingTaskRepository;\n    private final GradingItemRepository gradingItemRepository;\n    private final AnswerItemRepository answerItemRepository;\n    private final AnswerSheetRepository answerSheetRepository;\n')
text = text.replace('        GradingTaskRepository gradingTaskRepository,\n        AnswerSheetRepository answerSheetRepository,\n', '        GradingTaskRepository gradingTaskRepository,\n        GradingItemRepository gradingItemRepository,\n        AnswerItemRepository answerItemRepository,\n        AnswerSheetRepository answerSheetRepository,\n')
text = text.replace('        this.gradingTaskRepository = gradingTaskRepository;\n        this.answerSheetRepository = answerSheetRepository;\n', '        this.gradingTaskRepository = gradingTaskRepository;\n        this.gradingItemRepository = gradingItemRepository;\n        this.answerItemRepository = answerItemRepository;\n        this.answerSheetRepository = answerSheetRepository;\n')
old = '''    @Transactional(readOnly = true)
    public PageResponse<GradingTaskResponse> listTasksPage(String examId, Integer page, Integer pageSize) {
        List<GradingTaskResponse> tasks = listTasks(examId);
        return PageResponse.fromList(tasks, page, pageSize);
    }
'''
new = '''    @Transactional(readOnly = true)
    public PageResponse<GradingTaskResponse> listTasksPage(String examId, Integer page, Integer pageSize) {
        boolean admin = currentUserIsAdmin();
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingTaskEntity> taskPage = gradingTaskRepository.pageVisibleTasks(
            normalizeExamId(examId),
            admin,
            visibleClassIds,
            pageRequest
        );
        if (taskPage.isEmpty() && taskPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= taskPage.getTotalPages()) {
            pageRequest = PageRequest.of(taskPage.getTotalPages() - 1, pageRequest.getPageSize());
            taskPage = gradingTaskRepository.pageVisibleTasks(normalizeExamId(examId), admin, visibleClassIds, pageRequest);
        }
        return PageResponse.fromPage(taskPage.map(task -> mapper.toResponse(task, false)));
    }
'''
if old not in text:
    raise SystemExit('listTasksPage block not found')
text = text.replace(old, new)
old = '''    @Transactional(readOnly = true)
    public PageResponse<GradingItemResponse> listTaskItems(String gradingTaskId, Integer page, Integer pageSize) {
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        Map<String, AnswerItemEntity> answers = task.getAnswerSheet().getItems().stream()
            .collect(
                LinkedHashMap::new,
                (map, item) -> map.put(item.getQuestionId(), item),
                LinkedHashMap::putAll
            );
        List<GradingItemResponse> items = task.getItems().stream()
            .map(item -> mapper.toItemResponse(item, answers.get(item.getQuestion().getId())))
            .toList();
        return PageResponse.fromList(items, page, pageSize);
    }
'''
new = '''    @Transactional(readOnly = true)
    public PageResponse<GradingItemResponse> listTaskItems(String gradingTaskId, Integer page, Integer pageSize) {
        GradingTaskEntity task = findTaskForScopeCheck(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingItemEntity> itemPage = gradingItemRepository.findByGradingTaskIdOrderByCreatedAtAsc(gradingTaskId, pageRequest);
        if (itemPage.isEmpty() && itemPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= itemPage.getTotalPages()) {
            pageRequest = PageRequest.of(itemPage.getTotalPages() - 1, pageRequest.getPageSize());
            itemPage = gradingItemRepository.findByGradingTaskIdOrderByCreatedAtAsc(gradingTaskId, pageRequest);
        }

        List<String> questionIds = itemPage.getContent().stream()
            .map(item -> item.getQuestion().getId())
            .toList();
        Map<String, AnswerItemEntity> answers = questionIds.isEmpty()
            ? Map.of()
            : answerItemRepository.findByAnswerSheetIdAndQuestionIdIn(task.getAnswerSheet().getId(), questionIds).stream()
                .collect(
                    LinkedHashMap::new,
                    (map, item) -> map.put(item.getQuestionId(), item),
                    LinkedHashMap::putAll
                );

        return PageResponse.fromPage(itemPage.map(item -> mapper.toItemResponse(item, answers.get(item.getQuestion().getId()))));
    }
'''
if old not in text:
    raise SystemExit('listTaskItems block not found')
text = text.replace(old, new)
insert = '''
    private GradingTaskEntity findTaskForScopeCheck(String gradingTaskId) {
        return gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
    }

    private PageRequest toPageRequest(Integer page, Integer pageSize) {
        return PageRequest.of(PageResponse.normalizePage(page) - 1, PageResponse.normalizePageSize(pageSize));
    }

    private boolean currentUserIsAdmin() {
        AuthUserEntity user = classScopeService.currentUser();
        return user.getRoles().contains(RoleCode.ADMIN);
    }

    private Set<String> visibleClassIdsForQuery(boolean admin) {
        return admin ? Set.of("__ALL_CLASSES__") : classScopeService.visibleClassIds();
    }

    private String normalizeExamId(String examId) {
        return examId == null || examId.isBlank() ? null : examId;
    }

'''
marker = '    private GradingTaskEntity findTaskWithItems(String gradingTaskId) {'
if marker not in text:
    raise SystemExit('marker not found')
text = text.replace(marker, insert + marker)
p.write_text(text, encoding='utf-8')
