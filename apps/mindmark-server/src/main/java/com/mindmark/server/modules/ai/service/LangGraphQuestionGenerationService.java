package com.mindmark.server.modules.ai.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import com.mindmark.server.modules.academic.repository.CourseRepository;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import com.mindmark.server.modules.question.service.QuestionWriteService;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.state.Channel;
import org.bsc.langgraph4j.state.Channels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

@Service
public class LangGraphQuestionGenerationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LangGraphQuestionGenerationService.class);

    private static final String START = "__START__";
    private static final String END = "__END__";

    private final CourseRepository courseRepository;
    private final AiProviderSettingService providerSettingService;
    private final AiChatQuestionGenerationClient aiClient;
    private final QuestionWriteService questionWriteService;
    private final ClassScopeService classScopeService;

    public LangGraphQuestionGenerationService(
        CourseRepository courseRepository,
        AiProviderSettingService providerSettingService,
        AiChatQuestionGenerationClient aiClient,
        QuestionWriteService questionWriteService,
        ClassScopeService classScopeService
    ) {
        this.courseRepository = courseRepository;
        this.providerSettingService = providerSettingService;
        this.aiClient = aiClient;
        this.questionWriteService = questionWriteService;
        this.classScopeService = classScopeService;
    }

    public List<QuestionResponse> generateAndPersist(
        AiQuestionGenerateRequest request,
        String teacherId,
        String teacherName
    ) {
        try {
            StateGraph<AiQuestionWorkflowState> graph = new StateGraph<>(AiQuestionWorkflowState.SCHEMA, AiQuestionWorkflowState::new)
                .addNode("validate_input", node_async(this::validateInput))
                .addNode("resolve_course", node_async(this::resolveCourse))
                .addNode("generate_with_ai", node_async(this::generateWithAi))
                .addNode("quality_gate", node_async(this::qualityGate))
                .addNode("persist_questions", node_async(this::persistQuestions))
                .addEdge(START, "validate_input")
                .addEdge("validate_input", "resolve_course")
                .addEdge("resolve_course", "generate_with_ai")
                .addEdge("generate_with_ai", "quality_gate")
                .addEdge("quality_gate", "persist_questions")
                .addEdge("persist_questions", END);

            AiQuestionWorkflowState finalState = graph.compile()
                .invoke(Map.of("request", request, "teacherId", teacherId, "teacherName", teacherName))
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question workflow returned empty state"));
            return require(finalState, "savedQuestions", List.class);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            Throwable rootCause = unwrapWorkflowException(exception);
            if (rootCause instanceof BusinessException businessException) {
                throw businessException;
            }
            LOGGER.warn("AI question workflow failed", rootCause);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question workflow failed: " + summarize(rootCause.getMessage()));
        }
    }

    private Map<String, Object> validateInput(AiQuestionWorkflowState state) {
        AiQuestionGenerateRequest request = require(state, "request", AiQuestionGenerateRequest.class);
        if (!hasText(request.courseId())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "courseId is required");
        }
        if (!hasText(request.prompt())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "prompt is required");
        }
        if (request.questionType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "questionType is required");
        }
        if (request.difficulty() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "difficulty is required");
        }
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > 5) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "count must be between 1 and 5");
        }
        String provider = providerSettingService.normalizeProviderOrDefault(request.provider());
        return Map.of("count", count, "provider", provider);
    }

    private Map<String, Object> resolveCourse(AiQuestionWorkflowState state) {
        AiQuestionGenerateRequest request = require(state, "request", AiQuestionGenerateRequest.class);
        String teacherId = require(state, "teacherId", String.class);
        classScopeService.requireUserCanAccessCourse(teacherId, request.courseId());
        CourseEntity course = courseRepository.findById(request.courseId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        return Map.of("course", course);
    }

    private Map<String, Object> generateWithAi(AiQuestionWorkflowState state) {
        AiQuestionGenerateRequest request = require(state, "request", AiQuestionGenerateRequest.class);
        CourseEntity course = require(state, "course", CourseEntity.class);
        String teacherId = require(state, "teacherId", String.class);
        String provider = require(state, "provider", String.class);
        AiProviderRuntimeConfig config = providerSettingService.resolveRuntimeConfig(teacherId, provider);
        List<QuestionCreateRequest> generatedQuestions = aiClient.generate(config, course, request);
        return Map.of("generatedQuestions", generatedQuestions);
    }

    private Map<String, Object> qualityGate(AiQuestionWorkflowState state) {
        AiQuestionGenerateRequest request = require(state, "request", AiQuestionGenerateRequest.class);
        int expectedCount = require(state, "count", Integer.class);
        @SuppressWarnings("unchecked")
        List<QuestionCreateRequest> generatedQuestions = (List<QuestionCreateRequest>) require(state, "generatedQuestions", List.class);
        if (generatedQuestions.isEmpty()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: no generated questions");
        }
        if (generatedQuestions.size() != expectedCount) {
            throw new BusinessException(
                ErrorCode.INTERNAL_ERROR,
                "AI quality gate failed: generated question count mismatch, expected " + expectedCount + ", actual " + generatedQuestions.size()
            );
        }
        for (QuestionCreateRequest question : generatedQuestions) {
            validateGeneratedQuestion(request, question);
        }
        return Map.of("qualityReport", "PASS:" + generatedQuestions.size());
    }

    private void validateGeneratedQuestion(AiQuestionGenerateRequest request, QuestionCreateRequest question) {
        if (question == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: question is null");
        }
        if (!request.courseId().equals(question.courseId())) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: courseId mismatch");
        }
        if (question.type() != request.questionType()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: questionType mismatch");
        }
        if (question.difficulty() != request.difficulty()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: difficulty mismatch");
        }
        if (!hasText(question.title()) || !hasText(question.analysis())) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: title and analysis are required");
        }
        if (question.answer() == null || question.answer().isNull() || question.answer().isMissingNode()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: answer is required");
        }
        if ((question.type() == QuestionType.SINGLE_CHOICE || question.type() == QuestionType.MULTIPLE_CHOICE)
            && (question.options() == null || !question.options().isArray() || question.options().size() < 4)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: choice question requires 4 options");
        }
        if ((question.type() == QuestionType.SHORT_ANSWER || question.type() == QuestionType.PROGRAMMING)
            && (question.scoringPoints() == null || !question.scoringPoints().isArray() || question.scoringPoints().isEmpty())) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI quality gate failed: subjective question requires scoringPoints");
        }
    }

    private Map<String, Object> persistQuestions(AiQuestionWorkflowState state) {
        @SuppressWarnings("unchecked")
        List<QuestionCreateRequest> generatedQuestions = (List<QuestionCreateRequest>) require(state, "generatedQuestions", List.class);
        String teacherName = require(state, "teacherName", String.class);
        String teacherId = require(state, "teacherId", String.class);
        List<QuestionResponse> savedQuestions = questionWriteService.createAiQuestions(generatedQuestions, teacherId, teacherName);
        return Map.of("savedQuestions", savedQuestions);
    }

    @SuppressWarnings("unchecked")
    private <T> T require(AiQuestionWorkflowState state, String key, Class<T> type) {
        return (T) state.value(key)
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Workflow state missing: " + key));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
    private Throwable unwrapWorkflowException(Throwable exception) {
        Throwable current = exception;
        while ((current instanceof CompletionException || current instanceof ExecutionException)
            && current.getCause() != null) {
            current = current.getCause();
        }
        return current;
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return "no detail";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() > 300 ? compact.substring(0, 300) : compact;
    }
    public static class AiQuestionWorkflowState extends AgentState {
        private static final AiQuestionGenerateRequest EMPTY_REQUEST = new AiQuestionGenerateRequest(
            "",
            "",
            "",
            QuestionType.SINGLE_CHOICE,
            Difficulty.MEDIUM,
            1,
            "",
            ""
        );

        static final Map<String, Channel<?>> SCHEMA = Map.of(
            "request", Channels.base(() -> EMPTY_REQUEST),
            "teacherId", Channels.base(() -> ""),
            "teacherName", Channels.base(() -> ""),
            "count", Channels.base(() -> 0),
            "provider", Channels.base(() -> ""),
            "course", Channels.base(CourseEntity::new),
            "generatedQuestions", Channels.base(() -> List.<QuestionCreateRequest>of()),
            "qualityReport", Channels.base(() -> ""),
            "savedQuestions", Channels.base(() -> List.<QuestionResponse>of())
        );

        public AiQuestionWorkflowState(Map<String, Object> initData) {
            super(initData);
        }
    }
}
