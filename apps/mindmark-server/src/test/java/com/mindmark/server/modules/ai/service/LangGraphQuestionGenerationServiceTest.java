package com.mindmark.server.modules.ai.service;

import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.util.Map;
import org.bsc.langgraph4j.StateGraph;
import org.junit.jupiter.api.Test;

import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LangGraphQuestionGenerationServiceTest {

    @Test
    void workflowSchemaDefaultsMustNotBreakGraphInitialization() throws Exception {
        StateGraph<LangGraphQuestionGenerationService.AiQuestionWorkflowState> graph = new StateGraph<>(
            LangGraphQuestionGenerationService.AiQuestionWorkflowState.SCHEMA,
            LangGraphQuestionGenerationService.AiQuestionWorkflowState::new
        )
            .addNode("noop", node_async(state -> Map.of("provider", "OPENAI")))
            .addEdge("__START__", "noop")
            .addEdge("noop", "__END__");

        var result = assertDoesNotThrow(() -> graph.compile().invoke(Map.of(
            "request", new AiQuestionGenerateRequest(
                "course-frontend-001",
                "OPENAI",
                "前端工程实践",
                QuestionType.SINGLE_CHOICE,
                Difficulty.MEDIUM,
                1,
                "Vue 组件通信",
                "题干清晰，选项区分度高，解析简明且必须使用中文。"
            ),
            "teacherId", "teacher-001",
            "teacherName", "教师"
        )));

        assertTrue(result.isPresent());
    }
}