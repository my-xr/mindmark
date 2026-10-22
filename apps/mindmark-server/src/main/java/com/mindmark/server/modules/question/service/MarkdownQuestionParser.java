package com.mindmark.server.modules.question.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class MarkdownQuestionParser {

    private static final Pattern QUESTION_HEADER_PATTERN = Pattern.compile("^\\s*\\*\\*([^*]+)\\*\\*\\s*[（(]([^）)]*)[）)]\\s*$");
    private static final Pattern OPTION_PATTERN = Pattern.compile("^\\s*([A-Z])\\s*[\\.．、)]\\s+(.+)\\s*$");
    private static final Pattern DEFAULT_SCORE_PATTERN = Pattern.compile("每题\\s*([0-9]+(?:\\.[0-9]+)?)\\s*分");
    private static final Pattern META_SCORE_PATTERN = Pattern.compile("分值\\s*[：:]\\s*([0-9]+(?:\\.[0-9]+)?)\\s*分");
    private static final List<String> QUOTE_LABELS = List.of("答案", "参考答案", "参考答案要点", "答案要点", "解析", "评分标准");

    private final ObjectMapper objectMapper;

    public MarkdownQuestionParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ParseResult parse(String markdown, String courseId, String courseName) {
        return parse(markdown, courseId, courseName, null);
    }

    public ParseResult parse(String markdown, String courseId, String courseName, String chapterId) {
        String normalizedMarkdown = normalize(markdown);
        if (normalizedMarkdown == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Markdown content is required");
        }
        String normalizedCourseId = required(courseId, "courseId");
        String normalizedCourseName = required(courseName, "courseName");

        List<String> warnings = new ArrayList<>();
        List<ParsedQuestion> parsedQuestions = new ArrayList<>();
        String[] lines = normalizedMarkdown.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);

        SectionContext context = new SectionContext();
        for (int index = 0; index < lines.length; index += 1) {
            String line = lines[index].trim();
            if (isHeading(line)) {
                context = context.next(line);
                continue;
            }
            Matcher header = QUESTION_HEADER_PATTERN.matcher(line);
            if (!header.matches()) {
                continue;
            }

            int end = index + 1;
            while (end < lines.length) {
                String nextLine = lines[end].trim();
                if (QUESTION_HEADER_PATTERN.matcher(nextLine).matches() || isHeading(nextLine)) {
                    break;
                }
                end += 1;
            }

            List<String> blockLines = Arrays.asList(Arrays.copyOfRange(lines, index, end));
            try {
                ParsedQuestion parsedQuestion = parseBlock(
                    header.group(1).trim(),
                    header.group(2).trim(),
                    blockLines,
                    context,
                    normalizedCourseId,
                    normalizedCourseName,
                    normalize(chapterId)
                );
                if (parsedQuestion != null) {
                    parsedQuestions.add(parsedQuestion);
                }
            } catch (BusinessException exception) {
                throw exception;
            } catch (Exception exception) {
                warnings.add("题目 " + header.group(1).trim() + " 解析失败：" + exception.getMessage());
            }
            index = end - 1;
        }

        if (parsedQuestions.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "No valid questions were parsed from Markdown");
        }

        return new ParseResult(parsedQuestions, warnings);
    }

    private ParsedQuestion parseBlock(
        String sourceNo,
        String meta,
        List<String> blockLines,
        SectionContext context,
        String courseId,
        String courseName,
        String chapterId
    ) {
        String answerText = extractQuotedSection(blockLines, "答案", "参考答案", "参考答案要点", "答案要点");
        String analysis = extractQuotedSection(blockLines, "解析");
        String scoringStandard = extractQuotedSection(blockLines, "评分标准");
        QuestionType type = resolveType(sourceNo, context, answerText);
        List<Map<String, String>> options = parseOptions(blockLines);
        String title = extractTitle(blockLines, type);
        if (title == null) {
            return null;
        }
        if (analysis == null) {
            analysis = scoringStandard != null ? scoringStandard : "由 Markdown 题库导入，教师可在题库中继续维护解析。";
        }
        if (answerText == null) {
            answerText = scoringStandard != null ? scoringStandard : analysis;
        }

        BigDecimal score = resolveScore(meta, context);
        QuestionCreateRequest request = new QuestionCreateRequest(
            courseId,
            chapterId,
            title,
            type,
            resolveDifficulty(meta),
            List.of(courseName),
            score,
            buildAnswer(type, answerText),
            analysis,
            objectMapper.valueToTree(type == QuestionType.TRUE_FALSE && options.isEmpty() ? trueFalseOptions() : options),
            buildScoringPoints(type, scoringStandard, answerText, score)
        );
        return new ParsedQuestion(sourceNo, request);
    }

    private QuestionType resolveType(String sourceNo, SectionContext context, String answerText) {
        String normalizedSourceNo = sourceNo.toLowerCase(Locale.ROOT);
        if (normalizedSourceNo.contains("判断")) {
            return QuestionType.TRUE_FALSE;
        }
        if (normalizedSourceNo.contains("填空")) {
            return QuestionType.FILL_BLANK;
        }
        if (normalizedSourceNo.contains("编程") || normalizedSourceNo.contains("接口设计")) {
            return QuestionType.PROGRAMMING;
        }
        if (normalizedSourceNo.contains("程序") || normalizedSourceNo.contains("案例")) {
            return QuestionType.CASE_ANALYSIS;
        }
        if (normalizedSourceNo.contains("简答")) {
            return QuestionType.SHORT_ANSWER;
        }
        if (normalizedSourceNo.contains("论述")) {
            return QuestionType.ESSAY;
        }

        String sectionHeading = context.heading().toLowerCase(Locale.ROOT);
        if (sectionHeading.contains("判断")) {
            return QuestionType.TRUE_FALSE;
        }
        if (sectionHeading.contains("填空")) {
            return QuestionType.FILL_BLANK;
        }
        if (sectionHeading.contains("编程") || sectionHeading.contains("接口设计")) {
            return QuestionType.PROGRAMMING;
        }
        if (sectionHeading.contains("程序") || sectionHeading.contains("案例")) {
            return QuestionType.CASE_ANALYSIS;
        }
        if (sectionHeading.contains("简答")) {
            return QuestionType.SHORT_ANSWER;
        }
        if (sectionHeading.contains("论述")) {
            return QuestionType.ESSAY;
        }
        if (context.choiceMode() == ChoiceMode.MULTIPLE || countAnswerLetters(answerText) > 1) {
            return QuestionType.MULTIPLE_CHOICE;
        }
        return QuestionType.SINGLE_CHOICE;
    }

    private Difficulty resolveDifficulty(String meta) {
        if (meta.contains("★★★★★")) {
            return Difficulty.VERY_HARD;
        }
        if (meta.contains("★★★★")) {
            return Difficulty.HARD;
        }
        if (meta.contains("★★★")) {
            return Difficulty.HARD;
        }
        if (meta.contains("★★")) {
            return Difficulty.MEDIUM;
        }
        if (meta.contains("★")) {
            return Difficulty.EASY;
        }
        return Difficulty.MEDIUM;
    }

    private BigDecimal resolveScore(String meta, SectionContext context) {
        Matcher matcher = META_SCORE_PATTERN.matcher(meta);
        if (matcher.find()) {
            return new BigDecimal(matcher.group(1));
        }
        return context.defaultScore();
    }

    private String extractTitle(List<String> blockLines, QuestionType type) {
        List<String> titleLines = new ArrayList<>();
        for (int index = 1; index < blockLines.size(); index += 1) {
            String original = blockLines.get(index);
            String trimmed = original.trim();
            if (trimmed.isEmpty() || "---".equals(trimmed)) {
                continue;
            }
            if (trimmed.startsWith(">")) {
                continue;
            }
            if (isObjectiveType(type) && OPTION_PATTERN.matcher(trimmed).matches()) {
                continue;
            }
            titleLines.add(original.replace("**题目**：", "").replace("**题目**:", "").stripTrailing());
        }
        return normalize(String.join("\n", titleLines));
    }

    private List<Map<String, String>> parseOptions(List<String> blockLines) {
        List<Map<String, String>> options = new ArrayList<>();
        for (String line : blockLines) {
            Matcher matcher = OPTION_PATTERN.matcher(line.trim());
            if (!matcher.matches()) {
                continue;
            }
            Map<String, String> option = new LinkedHashMap<>();
            option.put("key", matcher.group(1).trim());
            option.put("content", matcher.group(2).trim());
            options.add(option);
        }
        return options;
    }

    private List<Map<String, String>> trueFalseOptions() {
        return List.of(
            Map.of("key", "正确", "content", "正确"),
            Map.of("key", "错误", "content", "错误")
        );
    }

    private JsonNode buildAnswer(QuestionType type, String answerText) {
        String normalized = normalize(cleanAnswerText(answerText));
        if (normalized == null) {
            normalized = "待教师维护";
        }
        if (type == QuestionType.MULTIPLE_CHOICE) {
            List<String> letters = extractAnswerLetters(normalized);
            return objectMapper.valueToTree(letters.isEmpty() ? List.of(normalized) : letters);
        }
        if (type == QuestionType.SINGLE_CHOICE) {
            List<String> letters = extractAnswerLetters(normalized);
            return objectMapper.valueToTree(letters.isEmpty() ? normalized : letters.getFirst());
        }
        if (type == QuestionType.TRUE_FALSE) {
            if (normalized.contains("正确") || normalized.equalsIgnoreCase("true")) {
                return objectMapper.valueToTree("正确");
            }
            if (normalized.contains("错误") || normalized.equalsIgnoreCase("false")) {
                return objectMapper.valueToTree("错误");
            }
        }
        return objectMapper.valueToTree(normalized);
    }

    private JsonNode buildScoringPoints(QuestionType type, String scoringStandard, String answerText, BigDecimal score) {
        if (isObjectiveType(type)) {
            return objectMapper.valueToTree(List.of());
        }
        String description = normalize(scoringStandard);
        if (description == null) {
            description = "参考答案：" + cleanAnswerText(answerText);
        }
        Map<String, Object> scoringPoint = new LinkedHashMap<>();
        scoringPoint.put("id", "SP-1");
        scoringPoint.put("description", description);
        scoringPoint.put("score", score);
        scoringPoint.put("keywords", List.of());
        scoringPoint.put("required", true);
        return objectMapper.valueToTree(List.of(scoringPoint));
    }

    private String extractQuotedSection(List<String> lines, String... labels) {
        List<String> collected = new ArrayList<>();
        boolean started = false;
        for (String line : lines) {
            String content = stripQuotePrefix(line);
            if (content == null) {
                if (started && !collected.isEmpty()) {
                    collected.add("");
                }
                continue;
            }
            String matchedLabel = matchedQuoteLabel(content);
            if (matchedLabel != null) {
                if (started) {
                    break;
                }
                if (!containsLabel(labels, matchedLabel)) {
                    continue;
                }
                started = true;
                String inline = extractInlineLabelContent(content, matchedLabel);
                if (normalize(inline) != null) {
                    collected.add(inline);
                }
                continue;
            }
            if (started) {
                collected.add(content);
            }
        }
        return normalize(String.join("\n", collected));
    }

    private String stripQuotePrefix(String line) {
        String trimmed = line.trim();
        if (!trimmed.startsWith(">")) {
            return null;
        }
        return trimmed.substring(1).trim();
    }

    private String matchedQuoteLabel(String content) {
        for (String label : QUOTE_LABELS) {
            if (content.startsWith("**" + label + "：") || content.startsWith("**" + label + ":")) {
                return label;
            }
            if (content.startsWith("**" + label + "**：") || content.startsWith("**" + label + "**:")) {
                return label;
            }
        }
        return null;
    }

    private String extractInlineLabelContent(String content, String label) {
        String value = content;
        value = value.replaceFirst("^\\*\\*" + Pattern.quote(label) + "[：:]", "");
        value = value.replaceFirst("^\\*\\*" + Pattern.quote(label) + "\\*\\*[：:]", "");
        value = value.replace("**", "");
        return value.trim();
    }

    private boolean containsLabel(String[] labels, String value) {
        return Arrays.stream(labels).anyMatch(label -> label.equals(value));
    }

    private boolean isObjectiveType(QuestionType type) {
        return type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE;
    }

    private int countAnswerLetters(String value) {
        return extractAnswerLetters(value).size();
    }

    private List<String> extractAnswerLetters(String value) {
        if (value == null) {
            return List.of();
        }
        Matcher matcher = Pattern.compile("[A-Z]").matcher(value.toUpperCase(Locale.ROOT));
        List<String> letters = new ArrayList<>();
        while (matcher.find()) {
            String letter = matcher.group();
            if (!letters.contains(letter)) {
                letters.add(letter);
            }
        }
        return letters;
    }

    private String cleanAnswerText(String value) {
        return value == null ? "" : value.replace("**", "").trim();
    }

    private boolean isHeading(String line) {
        return line.startsWith("## ") || line.startsWith("### ");
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, fieldName + " is required");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record ParseResult(List<ParsedQuestion> questions, List<String> warnings) {
    }

    public record ParsedQuestion(String sourceNo, QuestionCreateRequest request) {
    }

    private enum ChoiceMode {
        SINGLE,
        MULTIPLE,
        UNKNOWN
    }

    private record SectionContext(String heading, ChoiceMode choiceMode, BigDecimal defaultScore) {
        private SectionContext() {
            this("", ChoiceMode.UNKNOWN, BigDecimal.valueOf(2));
        }

        private SectionContext next(String heading) {
            ChoiceMode nextChoiceMode = choiceMode;
            if (heading.contains("单项选择")) {
                nextChoiceMode = ChoiceMode.SINGLE;
            } else if (heading.contains("多项选择")) {
                nextChoiceMode = ChoiceMode.MULTIPLE;
            } else if (!heading.contains("选择")) {
                nextChoiceMode = ChoiceMode.UNKNOWN;
            }
            BigDecimal nextScore = defaultScore;
            Matcher scoreMatcher = DEFAULT_SCORE_PATTERN.matcher(heading);
            if (scoreMatcher.find()) {
                nextScore = new BigDecimal(scoreMatcher.group(1));
            }
            return new SectionContext(heading, nextChoiceMode, nextScore);
        }
    }
}