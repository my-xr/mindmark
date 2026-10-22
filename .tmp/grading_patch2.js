const fs = require('fs');
const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
let t = fs.readFileSync(p, 'utf8');
t = t.replace(/    public GradingTaskEntity createTaskForSubmittedAnswerSheet\(String answerSheetId\) \{[\s\S]*?\n    \}\r?\n\r?\n    @Transactional\r?\n    public GradingTaskResponse autoGrade/, `    public GradingTaskEntity createTaskForSubmittedAnswerSheet(String answerSheetId) {
        GradingTaskEntity task = gradingTaskRepository.findByAnswerSheetId(answerSheetId)
            .orElseGet(() -> createNewTask(answerSheetId));
        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task);
            task = gradingTaskRepository.save(task);
        }
        promoteExamToGradingIfReady(task.getExam(), OffsetDateTime.now());
        return task;
    }

    @Transactional
    public GradingTaskResponse autoGrade`);
t = t.replace(/                item\.setAutoScore\(result\.score\(\)\);\r?\n                item\.setFinalScore\(result\.score\(\)\);\r?\n                item\.setCorrect\(result\.correct\(\)\);\r?\n                item\.setComment\(Boolean\.TRUE\.equals\(result\.correct\(\)\) \? "客观题自动判分：答案正确。" : "客观题自动判分：答案错误。"\);/, `                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(new BigDecimal("1.00"));
                item.setNeedsReview(false);
                item.setComment(Boolean.TRUE.equals(result.correct()) ? "客观题自动判分：答案正确。" : "客观题自动判分：答案错误。");`);
t = t.replace(/                item\.setAutoScore\(result\.score\(\)\);\r?\n                item\.setFinalScore\(result\.score\(\)\);\r?\n                item\.setCorrect\(result\.correct\(\)\);\r?\n                item\.setComment\(result\.comment\(\)\);/, `                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(result.confidence());
                item.setNeedsReview(result.needsReview());
                item.setComment(result.comment());`);
t = t.replace(/        item\.setFinalScore\(request\.finalScore\(\)\);\r?\n        item\.setComment\(request\.comment\(\)\);\r?\n        item\.setCorrect\(request\.finalScore\(\)\.compareTo\(item\.getMaxScore\(\)\.multiply\(new BigDecimal\("0\.60"\)\)\) >= 0\);/, `        item.setFinalScore(request.finalScore());
        if (request.comment() != null && !request.comment().isBlank()) {
            item.setComment(request.comment());
        }
        item.setCorrect(request.finalScore().compareTo(item.getMaxScore().multiply(new BigDecimal("0.60"))) >= 0);
        item.setNeedsReview(false);`);
fs.writeFileSync(p, t, 'utf8');
console.log('has setAiConfidence', t.includes('setAiConfidence'));
console.log('create auto', t.includes('applyAutoGrade(task);\n            task = gradingTaskRepository.save(task);'));
