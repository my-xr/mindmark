const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobService.java';
let s=fs.readFileSync(f,'utf8');
s=s.replace('        if (!asyncEnabled) {\r\n            return latestJob(gradingTaskId);\r\n        }', '        if (!asyncEnabled) {\r\n            return null;\r\n        }');
s=s.replace('            return latestJob(gradingTaskId);', '            return latestJobInternal(gradingTaskId, checkScope);');
s=s.replace('            return latestJob(gradingTaskId);', '            return latestJobInternal(gradingTaskId, checkScope);');
s=s.replace(`    @Transactional(readOnly = true)
    public GradingAiJobResponse latestJob(String gradingTaskId) {
        GradingTaskEntity task = gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        classScopeService.requireCanAccessExam(task.getExam());
        return jobRepository.findTopByGradingTaskIdOrderByCreatedAtDesc(gradingTaskId)
            .map(mapper::toResponse)
            .orElse(null);
    }`, `    @Transactional(readOnly = true)
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
    }`);
fs.writeFileSync(f,s,'utf8');