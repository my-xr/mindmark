const fs = require('fs');
function writeUtf8NoBom(path, text) { fs.writeFileSync(path, text, {encoding:'utf8'}); }
let p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/domain/GradingItemEntity.java';
let t = fs.readFileSync(p, 'utf8');
if (!t.includes('private BigDecimal aiConfidence;')) {
  t = t.replace(
`    @Column(name = "is_correct")
    private Boolean correct;

    @Column(columnDefinition = "text")`, 
`    @Column(name = "is_correct")
    private Boolean correct;

    @Column(name = "ai_confidence", precision = 5, scale = 2)
    private BigDecimal aiConfidence;

    @Column(name = "needs_review")
    private Boolean needsReview;

    @Column(columnDefinition = "text")`
  );
  t = t.replace(
`    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
    public String getComment() { return comment; }`,
`    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
    public BigDecimal getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(BigDecimal aiConfidence) { this.aiConfidence = aiConfidence; }
    public Boolean getNeedsReview() { return needsReview; }
    public void setNeedsReview(Boolean needsReview) { this.needsReview = needsReview; }
    public String getComment() { return comment; }`
  );
  writeUtf8NoBom(p, t);
}

p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
t = fs.readFileSync(p, 'utf8');
t = t.replace(
`    public GradingTaskEntity createTaskForSubmittedAnswerSheet(String answerSheetId) {
        GradingTaskEntity task = gradingTaskRepository.findByAnswerSheetId(answerSheetId)
            .orElseGet(() -> createNewTask(answerSheetId));
        promoteExamToGradingIfReady(task.getExam(), OffsetDateTime.now());
        return task;
    }`,
`    public GradingTaskEntity createTaskForSubmittedAnswerSheet(String answerSheetId) {
        GradingTaskEntity task = gradingTaskRepository.findByAnswerSheetId(answerSheetId)
            .orElseGet(() -> createNewTask(answerSheetId));
        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task);
            task = gradingTaskRepository.save(task);
        }
        promoteExamToGradingIfReady(task.getExam(), OffsetDateTime.now());
        return task;
    }`
);
t = t.replace(
`                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setComment(Boolean.TRUE.equals(result.correct()) ? "客观题自动判分：答案正确。" : "客观题自动判分：答案错误。");`,
`                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(new BigDecimal("1.00"));
                item.setNeedsReview(false);
                item.setComment(Boolean.TRUE.equals(result.correct()) ? "客观题自动判分：答案正确。" : "客观题自动判分：答案错误。");`
);
t = t.replace(
`                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setComment(result.comment());`,
`                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(result.confidence());
                item.setNeedsReview(result.needsReview());
                item.setComment(result.comment());`
);
t = t.replace(
`        item.setFinalScore(request.finalScore());
        item.setComment(request.comment());
        item.setCorrect(request.finalScore().compareTo(item.getMaxScore().multiply(new BigDecimal("0.60"))) >= 0);`,
`        item.setFinalScore(request.finalScore());
        if (request.comment() != null && !request.comment().isBlank()) {
            item.setComment(request.comment());
        }
        item.setCorrect(request.finalScore().compareTo(item.getMaxScore().multiply(new BigDecimal("0.60"))) >= 0);
        item.setNeedsReview(false);`
);
writeUtf8NoBom(p, t);

p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskMapper.java';
t = fs.readFileSync(p, 'utf8');
t = t.replace(
`        BigDecimal confidence = estimateItemConfidence(item);
        boolean needsReview = needsItemReview(item, confidence);`,
`        BigDecimal confidence = item.getAiConfidence() == null ? estimateItemConfidence(item) : item.getAiConfidence();
        boolean needsReview = item.getNeedsReview() == null ? needsItemReview(item, confidence) : item.getNeedsReview();`
);
t = t.replace(
`    private boolean needsItemReview(GradingItemEntity item, BigDecimal confidence) {
        if (item.getFinalScore() == null && item.getAutoScore() == null) {
            return true;
        }
        if (Boolean.TRUE.equals(item.getObjective())) {
            return false;
        }
        return confidence.compareTo(LOW_CONFIDENCE_THRESHOLD) < 0 || Boolean.FALSE.equals(item.getCorrect());
    }`,
`    private boolean needsItemReview(GradingItemEntity item, BigDecimal confidence) {
        if (item.getNeedsReview() != null) {
            return item.getNeedsReview();
        }
        if (item.getFinalScore() == null && item.getAutoScore() == null) {
            return true;
        }
        if (Boolean.TRUE.equals(item.getObjective())) {
            return false;
        }
        return confidence.compareTo(LOW_CONFIDENCE_THRESHOLD) < 0 || Boolean.FALSE.equals(item.getCorrect());
    }`
);
writeUtf8NoBom(p, t);
