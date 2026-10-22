const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobService.java';
let s=fs.readFileSync(f,'utf8');
s=s.replace(/    @Transactional\(readOnly = true\)\r?\n    public GradingAiJobResponse latestJob\(String gradingTaskId\) \{[\s\S]*?    \}\r?\n\r?\n    private void dispatchAfterCommit/, `    @Transactional(readOnly = true)
    public GradingAiJobResponse latestJob(String gradingTaskId) {
        return latestJobInternal(gradingTaskId, true);
    }

    private GradingAiJobResponse latestJobInternal(String gradingTaskId, boolean checkScope) {
        GradingTaskEntity task = gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        if (checkScope) {
            classScopeService.requireCanAccessExam(task.getExam());
        }
        return jobRepository.findTopByGradingTaskIdOrderByCreatedAtDesc(gradingTaskId)
            .map(mapper::toResponse)
            .orElse(null);
    }

    private void dispatchAfterCommit`);
fs.writeFileSync(f,s,'utf8');