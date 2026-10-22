const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
let text = fs.readFileSync(path, 'utf8');
const marker = '    private PaperQuestionEntity createPaperQuestion(\n';
if (!text.includes('private PaperComposeQualityReportResponse buildQualityReport')) {
const helper = `    private List<QualityQuestion> toQualityQuestionsForDraft(
        PaperEntity paper,
        PaperComposeMode mode,
        List<SelectedQuestion> selectedQuestions
    ) {
        ArrayList<QualityQuestion> questions = new ArrayList<>();
        if (mode == PaperComposeMode.APPEND) {
            paper.getQuestions().forEach(item -> questions.add(new QualityQuestion(
                item.getQuestion().getType(),
                item.getQuestion().getDifficulty(),
                item.getScore(),
                safeKnowledgePoints(item.getQuestion())
            )));
        }
        selectedQuestions.forEach(item -> questions.add(new QualityQuestion(
            item.question().getType(),
            item.question().getDifficulty(),
            item.score(),
            safeKnowledgePoints(item.question())
        )));
        return questions;
    }

    private List<QualityQuestion> toQualityQuestionsFromPaper(PaperEntity paper) {
        return paper.getQuestions().stream()
            .map(item -> new QualityQuestion(
                item.getQuestion().getType(),
                item.getQuestion().getDifficulty(),
                item.getScore(),
                safeKnowledgePoints(item.getQuestion())
            ))
            .toList();
    }

    private PaperComposeQualityReportResponse buildQualityReport(List<QualityQuestion> questions, BigDecimal targetScore) {
        BigDecimal actualScore = questions.stream()
            .map(QualityQuestion::score)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<PaperComposeDistributionItemResponse> typeDistribution = buildTypeDistribution(questions, actualScore);
        List<PaperComposeDistributionItemResponse> difficultyDistribution = buildDifficultyDistribution(questions, actualScore);
        List<PaperComposeDistributionItemResponse> knowledgePointDistribution = buildKnowledgePointDistribution(questions, actualScore);
        int knowledgePointCount = (int) questions.stream()
            .flatMap(question -> question.knowledgePoints().stream())
            .map(this::normalizeText)
            .filter(this::hasText)
            .distinct()
            .count();

        ArrayList<String> highlights = new ArrayList<>();
        ArrayList<String> risks = new ArrayList<>();
        if (actualScore.compareTo(targetScore) == 0) {
            highlights.add("总分与目标分一致，满足发布前基础分值要求。");
        } else {
            risks.add("当前总分 " + actualScore.stripTrailingZeros().toPlainString() + " 分，与目标 " + targetScore.stripTrailingZeros().toPlainString() + " 分不一致。");
        }
        if (typeDistribution.size() >= 4) {
            highlights.add("题型覆盖较完整，适合综合性考试。 ");
        } else {
            risks.add("题型覆盖偏少，建议至少覆盖客观题与主观题。 ");
        }
        if (knowledgePointCount >= 5) {
            highlights.add("知识点覆盖达到 " + knowledgePointCount + " 个，具备较好的章节覆盖度。");
        } else {
            risks.add("知识点覆盖仅 " + knowledgePointCount + " 个，建议补充不同章节或核心能力点。 ");
        }
        long hardCount = questions.stream()
            .filter(question -> question.difficulty() == Difficulty.HARD || question.difficulty() == Difficulty.VERY_HARD)
            .count();
        if (!questions.isEmpty() && hardCount > questions.size() * 0.5) {
            risks.add("较高难度题目占比超过 50%，请确认考试定位与学生水平匹配。 ");
        }
        if (!questions.isEmpty() && hardCount > 0 && hardCount <= questions.size() * 0.5) {
            highlights.add("包含一定比例中高难度题目，可区分不同掌握程度。 ");
        }

        return new PaperComposeQualityReportResponse(
            targetScore,
            actualScore,
            questions.size(),
            knowledgePointCount,
            typeDistribution,
            difficultyDistribution,
            knowledgePointDistribution,
            List.copyOf(highlights),
            List.copyOf(risks)
        );
    }

    private List<PaperComposeDistributionItemResponse> buildTypeDistribution(List<QualityQuestion> questions, BigDecimal totalScore) {
        Map<QuestionType, ScoreCounter> counters = new LinkedHashMap<>();
        for (QuestionType type : QuestionType.values()) {
            counters.put(type, new ScoreCounter());
        }
        questions.forEach(question -> counters.get(question.type()).add(question.score()));
        return counters.entrySet().stream()
            .filter(entry -> entry.getValue().count() > 0)
            .map(entry -> distributionItem(entry.getKey().name(), questionTypeLabel(entry.getKey()), entry.getValue(), totalScore))
            .toList();
    }

    private List<PaperComposeDistributionItemResponse> buildDifficultyDistribution(List<QualityQuestion> questions, BigDecimal totalScore) {
        Map<Difficulty, ScoreCounter> counters = new LinkedHashMap<>();
        for (Difficulty difficulty : Difficulty.values()) {
            counters.put(difficulty, new ScoreCounter());
        }
        questions.forEach(question -> counters.get(question.difficulty()).add(question.score()));
        return counters.entrySet().stream()
            .filter(entry -> entry.getValue().count() > 0)
            .map(entry -> distributionItem(entry.getKey().name(), difficultyLabel(entry.getKey()), entry.getValue(), totalScore))
            .toList();
    }

    private List<PaperComposeDistributionItemResponse> buildKnowledgePointDistribution(List<QualityQuestion> questions, BigDecimal totalScore) {
        Map<String, ScoreCounter> counters = new LinkedHashMap<>();
        questions.forEach(question -> {
            List<String> points = question.knowledgePoints().isEmpty() ? List.of("未标注") : question.knowledgePoints();
            points.forEach(point -> counters.computeIfAbsent(point, ignored -> new ScoreCounter()).add(question.score()));
        });
        return counters.entrySet().stream()
            .sorted((left, right) -> right.getValue().score().compareTo(left.getValue().score()))
            .limit(8)
            .map(entry -> distributionItem(entry.getKey(), entry.getKey(), entry.getValue(), totalScore))
            .toList();
    }

    private PaperComposeDistributionItemResponse distributionItem(
        String key,
        String label,
        ScoreCounter counter,
        BigDecimal totalScore
    ) {
        return new PaperComposeDistributionItemResponse(
            key,
            label,
            counter.count(),
            counter.score(),
            percentage(counter.score(), totalScore)
        );
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return value.multiply(new BigDecimal("100")).divide(total, 1, java.math.RoundingMode.HALF_UP);
    }

    private PaperComposeAgentPlanResponse buildAgentPlan(
        PaperCompositionDraft draft,
        PaperComposeQualityReportResponse qualityReport
    ) {
        return composePlanService.plan(new LangGraphPaperComposePlanService.PaperComposePlanContext(
            draft.paper().getId(),
            draft.paper().getTitle(),
            draft.paper().getCourseName(),
            draft.mode(),
            draft.strategy(),
            draft.targetScore(),
            draft.baseScore(),
            draft.ruleScore(),
            draft.plannedFinalScore(),
            draft.selectedQuestions().size(),
            draft.rules(),
            qualityReport
        ));
    }

`;
  if (!text.includes(marker)) throw new Error('marker not found');
  text = text.replace(marker, helper + marker);
}
if (!text.includes('private String difficultyLabel')) {
  text = text.replace(`    private String questionTypeLabel(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case PROGRAMMING -> "编程题";
        };
    }

`, `    private String questionTypeLabel(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case PROGRAMMING -> "编程题";
        };
    }

    private String difficultyLabel(Difficulty difficulty) {
        return switch (difficulty) {
            case VERY_EASY -> "很简单";
            case EASY -> "简单";
            case MEDIUM -> "中等";
            case HARD -> "困难";
            case VERY_HARD -> "很困难";
        };
    }

`);
}
if (!text.includes('private record PaperCompositionDraft')) {
  text = text.replace('    private record SelectedQuestion(QuestionEntity question, BigDecimal score) {\n    }\n', `    private record PaperCompositionDraft(
        PaperEntity paper,
        PaperComposeMode mode,
        PaperComposeStrategy strategy,
        List<PaperComposeRuleRequest> rules,
        BigDecimal ruleScore,
        BigDecimal baseScore,
        BigDecimal plannedFinalScore,
        BigDecimal targetScore,
        List<SelectedQuestion> selectedQuestions,
        List<PaperComposeGapResponse> gaps,
        List<String> warnings,
        PaperComposeQualityReportResponse qualityReport,
        PaperComposeAgentPlanResponse agentPlan
    ) {
    }

    private record SelectedQuestion(QuestionEntity question, BigDecimal score) {
    }

    private record QualityQuestion(
        QuestionType type,
        Difficulty difficulty,
        BigDecimal score,
        List<String> knowledgePoints
    ) {
    }

    private static class ScoreCounter {
        private int count;
        private BigDecimal score = BigDecimal.ZERO;

        void add(BigDecimal value) {
            count += 1;
            score = score.add(value == null ? BigDecimal.ZERO : value);
        }

        int count() {
            return count;
        }

        BigDecimal score() {
            return score;
        }
    }
`);
}
fs.writeFileSync(path, text, 'utf8');
