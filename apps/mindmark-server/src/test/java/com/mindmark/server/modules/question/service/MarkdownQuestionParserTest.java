package com.mindmark.server.modules.question.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class MarkdownQuestionParserTest {

    private final MarkdownQuestionParser parser = new MarkdownQuestionParser(new ObjectMapper());

    @Test
    void parseMarkdownQuestionsAndKeepSectionHeadingsOutOfTitle() {
        String markdown = """
            ## 一、选择题（共 2 题，每题 2 分）

            ### 1.1 单项选择题（1 题）

            **01-选择-001**（★ 知识点：K1）
            后端程序运行的位置是？
            A. 浏览器
            B. 服务器端
            C. 路由器
            D. 显示器

            > **答案：B**
            > **解析**：后端程序运行在服务器端。

            ---

            ### 1.2 多项选择题（1 题）

            **01-选择-002**（★★ 知识点：K2）
            下列属于 HTTP 常见请求方法的是？
            A. GET
            B. POST
            C. COMMIT
            D. PUSH

            > **答案：A、B**
            > **解析**：GET 和 POST 是常见 HTTP 请求方法。
            """;

        MarkdownQuestionParser.ParseResult result = parser.parse(markdown, "course-001", "Web 后端开发");

        assertThat(result.questions()).hasSize(2);
        assertThat(result.warnings()).isEmpty();
        assertThat(result.questions().get(0).request().type()).isEqualTo(QuestionType.SINGLE_CHOICE);
        assertThat(result.questions().get(1).request().type()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
        assertThat(result.questions())
            .allSatisfy(question -> {
                assertThat(question.request().title()).doesNotContain("###");
                assertThat(question.request().knowledgePoints()).containsExactly("Web 后端开发");
            });
    }

    @Test
    void parseRealExamQuestionBankSample() throws Exception {
        Path samplePath = Path.of("..", "..", "exam", "题库.md").toAbsolutePath().normalize();
        if (!Files.exists(samplePath)) {
            samplePath = Path.of("exam", "题库.md").toAbsolutePath().normalize();
        }

        String markdown = Files.readString(samplePath);

        MarkdownQuestionParser.ParseResult result = parser.parse(markdown, "course-backend-001", "Web 后端开发");

        assertThat(result.questions()).hasSize(78);
        assertThat(result.warnings()).isEmpty();
        assertThat(result.questions())
            .allSatisfy(question -> assertThat(question.request().knowledgePoints()).containsExactly("Web 后端开发"));
        assertThat(result.questions())
            .extracting(question -> question.request().type())
            .contains(
                QuestionType.SINGLE_CHOICE,
                QuestionType.MULTIPLE_CHOICE,
                QuestionType.TRUE_FALSE,
                QuestionType.FILL_BLANK,
                QuestionType.SHORT_ANSWER,
                QuestionType.CASE_ANALYSIS,
                QuestionType.PROGRAMMING
            );
        assertThat(result.questions())
            .filteredOn(question -> "01-简答-001".equals(question.sourceNo()))
            .singleElement()
            .satisfies(question -> assertThat(question.request().answer().asText()).contains("前后端分离"));
    }
}
