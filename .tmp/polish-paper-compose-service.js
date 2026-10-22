const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(
  '.map(gap -> gap.type() + " 需要 " + gap.requiredCount() + " 道，可用 " + gap.availableCount() + " 道")',
  '.map(gap -> questionTypeLabel(gap.type()) + " 需要 " + gap.requiredCount() + " 道，可用 " + gap.availableCount() + " 道")'
);
text = text.replace(
  'Set<String> actual = question.getKnowledgePoints().stream()\n            .map(this::normalizeText)',
  'Set<String> actual = safeKnowledgePoints(question).stream()\n            .map(this::normalizeText)'
);
text = text.replace(
  'return question.getKnowledgePoints().isEmpty() ? "未标注" : question.getKnowledgePoints().get(0);',
  'List<String> knowledgePoints = safeKnowledgePoints(question);\n        return knowledgePoints.isEmpty() ? "未标注" : knowledgePoints.get(0);'
);
const marker = `    private String primaryKnowledgePoint(QuestionEntity question) {
        List<String> knowledgePoints = safeKnowledgePoints(question);
        return knowledgePoints.isEmpty() ? "未标注" : knowledgePoints.get(0);
    }

`;
const insert = `    private List<String> safeKnowledgePoints(QuestionEntity question) {
        return question.getKnowledgePoints() == null ? List.of() : question.getKnowledgePoints();
    }

    private String questionTypeLabel(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case PROGRAMMING -> "编程题";
        };
    }

`;
if (!text.includes('private String questionTypeLabel')) {
  if (!text.includes(marker)) throw new Error('primaryKnowledgePoint marker not found');
  text = text.replace(marker, marker + insert);
}
fs.writeFileSync(path, text, 'utf8');
