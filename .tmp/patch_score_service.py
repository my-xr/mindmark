from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/score/service/ScoreService.java')
text = p.read_text(encoding='utf-8')
text = text.replace('import com.mindmark.server.modules.auth.domain.StudentProfileEntity;\n', 'import com.mindmark.server.modules.auth.domain.AuthUserEntity;\nimport com.mindmark.server.modules.auth.domain.RoleCode;\nimport com.mindmark.server.modules.auth.domain.StudentProfileEntity;\n')
text = text.replace('import org.springframework.stereotype.Service;\n', 'import org.springframework.data.domain.Page;\nimport org.springframework.data.domain.PageRequest;\nimport org.springframework.stereotype.Service;\n')
old = '''    @Transactional(readOnly = true)
    public PageResponse<ExamScoreSummaryResponse> listExamScoreSummaries(Integer page, Integer pageSize) {
        List<ExamScoreSummaryResponse> summaries = examRepository.findAllByOrderByUpdatedAtDesc().stream()
            .filter(classScopeService::canAccessAllExamClasses)
            .map(exam -> buildExamScoreSummary(exam, true))
            .filter(summary -> summary.submittedCount() > 0 || summary.reviewedCount() > 0)
            .toList();
        return PageResponse.fromList(summaries, page, pageSize);
    }
'''
new = '''    @Transactional(readOnly = true)
    public PageResponse<ExamScoreSummaryResponse> listExamScoreSummaries(Integer page, Integer pageSize) {
        boolean admin = currentUserIsAdmin();
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<ExamEntity> examPage = examRepository.pageVisibleExamsWithGradingTasks(admin, visibleClassIds, pageRequest);
        if (examPage.isEmpty() && examPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= examPage.getTotalPages()) {
            pageRequest = PageRequest.of(examPage.getTotalPages() - 1, pageRequest.getPageSize());
            examPage = examRepository.pageVisibleExamsWithGradingTasks(admin, visibleClassIds, pageRequest);
        }
        return PageResponse.fromPage(examPage.map(exam -> buildExamScoreSummary(exam, true)));
    }
'''
if old not in text:
    raise SystemExit('summary block not found')
text = text.replace(old, new)
old = '''    @Transactional(readOnly = true)
    public PageResponse<ScoreSummaryItemResponse> listExamScoreReports(String examId, Integer page, Integer pageSize) {
        ExamEntity exam = examRepository.findById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);
        return PageResponse.fromList(toRankedSummaryItems(reviewedTasks(examId)), page, pageSize);
    }
'''
new = '''    @Transactional(readOnly = true)
    public PageResponse<ScoreSummaryItemResponse> listExamScoreReports(String examId, Integer page, Integer pageSize) {
        ExamEntity exam = examRepository.findById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingTaskEntity> taskPage = gradingTaskRepository.findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
            examId,
            GradingTaskStatus.REVIEWED,
            pageRequest
        );
        if (taskPage.isEmpty() && taskPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= taskPage.getTotalPages()) {
            pageRequest = PageRequest.of(taskPage.getTotalPages() - 1, pageRequest.getPageSize());
            taskPage = gradingTaskRepository.findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
                examId,
                GradingTaskStatus.REVIEWED,
                pageRequest
            );
        }

        int rankStart = taskPage.getNumber() * taskPage.getSize() + 1;
        List<ScoreSummaryItemResponse> items = toRankedSummaryItems(taskPage.getContent(), rankStart);
        return new PageResponse<>(
            items,
            taskPage.getTotalElements(),
            taskPage.getNumber() + 1,
            taskPage.getSize(),
            Math.max(1, taskPage.getTotalPages()),
            taskPage.hasPrevious(),
            taskPage.hasNext()
        );
    }
'''
if old not in text:
    raise SystemExit('score reports block not found')
text = text.replace(old, new)
text = text.replace('            gradingTaskRepository.findByExamIdOrderByUpdatedAtDesc(exam.getId()).size(),\n', '            gradingTaskRepository.countByExamId(exam.getId()),\n')
old = '''    private List<ScoreSummaryItemResponse> toRankedSummaryItems(List<GradingTaskEntity> reviewedTasks) {
        List<ScoreSummaryItemResponse> items = new ArrayList<>();
        int rank = 1;
        for (GradingTaskEntity task : reviewedTasks) {
            items.add(new ScoreSummaryItemResponse(
                task.getId(),
                task.getAnswerSheet().getId(),
                task.getStudentId(),
                task.getStudentName(),
                task.getObjectiveScore(),
                task.getSubjectiveScore(),
                task.getFinalScore(),
                rank++
            ));
        }
        return items;
    }
'''
new = '''    private List<ScoreSummaryItemResponse> toRankedSummaryItems(List<GradingTaskEntity> reviewedTasks) {
        return toRankedSummaryItems(reviewedTasks, 1);
    }

    private List<ScoreSummaryItemResponse> toRankedSummaryItems(List<GradingTaskEntity> reviewedTasks, int rankStart) {
        List<ScoreSummaryItemResponse> items = new ArrayList<>();
        int rank = rankStart;
        for (GradingTaskEntity task : reviewedTasks) {
            items.add(new ScoreSummaryItemResponse(
                task.getId(),
                task.getAnswerSheet().getId(),
                task.getStudentId(),
                task.getStudentName(),
                task.getObjectiveScore(),
                task.getSubjectiveScore(),
                task.getFinalScore(),
                rank++
            ));
        }
        return items;
    }
'''
if old not in text:
    raise SystemExit('rank block not found')
text = text.replace(old, new)
insert = '''
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

'''
marker = '    private List<GradingTaskEntity> reviewedTasks(String examId) {'
if marker not in text:
    raise SystemExit('marker not found')
text = text.replace(marker, insert + marker)
p.write_text(text, encoding='utf-8')
