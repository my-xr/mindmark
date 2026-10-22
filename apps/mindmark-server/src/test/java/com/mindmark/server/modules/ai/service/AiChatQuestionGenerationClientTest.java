package com.mindmark.server.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatQuestionGenerationClientTest {

    private AiChatQuestionGenerationClient client;
    private Method parseQuestions;

    @BeforeEach
    void setUp() throws Exception {
        client = new AiChatQuestionGenerationClient(
            RestClient.builder(),
            new ObjectMapper(),
            2200,
            30000,
            3,
            1500,
            1
        );
        parseQuestions = AiChatQuestionGenerationClient.class.getDeclaredMethod(
            "parseQuestions",
            String.class,
            AiQuestionGenerateRequest.class
        );
        parseQuestions.setAccessible(true);
    }

    @Test
    void shouldParseStandardProgrammingQuestion() throws Exception {
        String json = """
            {"questions":[{
              "title":"请实现一个中文课程成绩统计函数，要求返回平均分和最高分。",
              "knowledgePoints":["数组遍历","函数设计"],
              "answer":{"idea":"先遍历数组累加总分并记录最高分，最后计算平均分。","code":"function stat(scores){return {avg:0,max:0};}"},
              "analysis":"本题考查数组遍历、边界处理和返回对象设计，关键是中文场景下的成绩统计逻辑。",
              "options":[],
              "scoringPoints":[
                {"description":"能够正确遍历成绩数组并累加总分","score":3,"keywords":["遍历","累加"],"required":true},
                {"description":"能够正确处理空数组或异常输入","score":3,"keywords":["边界"],"required":true},
                {"description":"能够返回平均分和最高分两个结果","score":4,"keywords":["平均分","最高分"],"required":true}
              ]
            }]}
            """;

        List<QuestionCreateRequest> questions = invokeParse(json, programmingRequest());

        assertEquals(1, questions.size());
        QuestionCreateRequest question = questions.getFirst();
        assertEquals(QuestionType.PROGRAMMING, question.type());
        assertEquals(BigDecimal.TEN, question.score());
        assertEquals("数组遍历", question.knowledgePoints().getFirst());
        assertEquals(3, question.scoringPoints().size());
    }

    @Test
    void shouldParseWrappedChineseFieldsForProgrammingQuestion() throws Exception {
        String json = """
            {"data":{"试题列表":[{
              "题目":"请编写一个防抖函数，要求说明在输入框搜索场景中的使用方式。",
              "知识点":"前端性能优化，事件处理",
              "分值":"12",
              "参考答案":{"思路":"使用定时器延迟执行，重复触发时清除旧定时器。","代码":"function debounce(fn, delay){ return (...args)=>fn(...args); }"},
              "解析":"本题考查防抖原理、闭包和定时器管理，答案需要体现中文业务场景。",
              "选项":[],
              "评分点":["说明防抖用于减少频繁触发", "能够清除旧定时器并创建新定时器", "能够保持函数参数传递和调用上下文"]
            }]}}
            """;

        List<QuestionCreateRequest> questions = invokeParse(json, programmingRequest());

        assertEquals(1, questions.size());
        QuestionCreateRequest question = questions.getFirst();
        assertEquals(new BigDecimal("12"), question.score());
        assertEquals(List.of("前端性能优化", "事件处理"), question.knowledgePoints());
        assertEquals(3, question.scoringPoints().size());
        assertTrue(question.title().contains("防抖函数"));
    }

    @Test
    void shouldRejectProgrammingQuestionWithoutScoringPoints() {
        String json = """
            {"questions":[{
              "title":"请实现一个中文姓名格式化函数。",
              "answer":"参考思路：先去除空格，再按规则拼接中文姓名。",
              "analysis":"本题考查字符串处理和边界情况。",
              "options":[]
            }]}
            """;

        InvocationTargetException exception = assertThrows(
            InvocationTargetException.class,
            () -> parseQuestions.invoke(client, json, programmingRequest())
        );
        assertInstanceOf(BusinessException.class, exception.getCause());
        assertTrue(exception.getCause().getMessage().contains("missing scoringPoints"));
    }

    @Test
    void shouldRejectEmptyQuestionsArray() {
        InvocationTargetException exception = assertThrows(
            InvocationTargetException.class,
            () -> parseQuestions.invoke(client, "{\"questions\":[]}", programmingRequest())
        );
        assertInstanceOf(BusinessException.class, exception.getCause());
        assertTrue(exception.getCause().getMessage().contains("empty questions array"));
    }

    @SuppressWarnings("unchecked")
    private List<QuestionCreateRequest> invokeParse(String json, AiQuestionGenerateRequest request) throws Exception {
        Object value = parseQuestions.invoke(client, json, request);
        assertNotNull(value);
        return (List<QuestionCreateRequest>) value;
    }

    private AiQuestionGenerateRequest programmingRequest() {
        return new AiQuestionGenerateRequest(
            "course-frontend-001",
            "OPENAI",
            "前端工程实践",
            QuestionType.PROGRAMMING,
            Difficulty.MEDIUM,
            1,
            "Vue 组件通信",
            "题干清晰，评分点完整，必须使用中文。"
        );
    }
}
