const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s = fs.readFileSync(path, 'utf8');
s = s.replace('            题型：%s\n', '            题型：%s\n');
s = s.replace('            request.questionType(),\n', '            questionTypeLabel(request.questionType()),\n');
const marker = `    private String difficultyLabel(Difficulty difficulty) {
        if (difficulty == null) {
            return "未指定";
        }
        return switch (difficulty) {
            case VERY_EASY -> "1级/很容易";
            case EASY -> "2级/容易";
            case MEDIUM -> "3级/中等";
            case HARD -> "4级/困难";
            case VERY_HARD -> "5级/很困难";
        };
    }
`;
const insert = `    private String questionTypeLabel(com.mindmark.server.modules.question.domain.QuestionType questionType) {
        if (questionType == null) {
            return "未指定";
        }
        return switch (questionType) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case PROGRAMMING -> "编程题";
        };
    }

`;
if (!s.includes(marker)) throw new Error('difficultyLabel marker not found');
s = s.replace(marker, insert + marker);
fs.writeFileSync(path, s, 'utf8');
