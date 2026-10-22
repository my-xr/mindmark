package com.mindmark.server.modules.programming.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.service.ExamLifecycleService;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.programming.domain.ProgrammingJudgeResultEntity;
import com.mindmark.server.modules.programming.domain.ProgrammingJudgeStatus;
import com.mindmark.server.modules.programming.domain.ProgrammingJudgeSubmissionEntity;
import com.mindmark.server.modules.programming.domain.ProgrammingTestCaseEntity;
import com.mindmark.server.modules.programming.dto.ProgrammingJudgeResultResponse;
import com.mindmark.server.modules.programming.dto.ProgrammingSubmissionRequest;
import com.mindmark.server.modules.programming.dto.ProgrammingSubmissionResponse;
import com.mindmark.server.modules.programming.dto.ProgrammingTestCaseRequest;
import com.mindmark.server.modules.programming.dto.ProgrammingTestCaseResponse;
import com.mindmark.server.modules.programming.repository.ProgrammingJudgeSubmissionRepository;
import com.mindmark.server.modules.programming.repository.ProgrammingTestCaseRepository;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import com.mindmark.server.modules.question.repository.QuestionRepository;
import com.mindmark.server.modules.paper.repository.PaperQuestionRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgrammingJudgeService {

    private static final Set<RoleCode> TEST_CASE_WRITE_ROLES = Set.of(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.TA);
    private static final Set<String> LANGUAGE_WHITELIST = Set.of("JAVASCRIPT", "TYPESCRIPT", "PYTHON", "JAVA");
    private static final int MAX_SOURCE_CODE_LENGTH = 200_000;
    private static final String P0_JUDGE_VERSION = "P0_CONTRACT_ONLY";

    private final QuestionRepository questionRepository;
    private final PaperQuestionRepository paperQuestionRepository;
    private final AnswerSheetRepository answerSheetRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final ProgrammingTestCaseRepository testCaseRepository;
    private final ProgrammingJudgeSubmissionRepository submissionRepository;
    private final ClassScopeService classScopeService;
    private final ExamLifecycleService examLifecycleService;

    public ProgrammingJudgeService(
        QuestionRepository questionRepository,
        PaperQuestionRepository paperQuestionRepository,
        AnswerSheetRepository answerSheetRepository,
        GradingTaskRepository gradingTaskRepository,
        ProgrammingTestCaseRepository testCaseRepository,
        ProgrammingJudgeSubmissionRepository submissionRepository,
        ClassScopeService classScopeService,
        ExamLifecycleService examLifecycleService
    ) {
        this.questionRepository = questionRepository;
        this.paperQuestionRepository = paperQuestionRepository;
        this.answerSheetRepository = answerSheetRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.testCaseRepository = testCaseRepository;
        this.submissionRepository = submissionRepository;
        this.classScopeService = classScopeService;
        this.examLifecycleService = examLifecycleService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProgrammingTestCaseResponse> listTestCases(String questionId, Integer page, Integer pageSize) {
        requireTestCaseWriteRole();
        QuestionEntity question = requireProgrammingQuestion(questionId);
        classScopeService.requireCanAccessCourse(question.getCourseId());
        Page<ProgrammingTestCaseResponse> result = testCaseRepository
            .findByQuestionIdOrderBySortOrderAscCreatedAtAsc(questionId, PageRequest.of(
                PageResponse.normalizePage(page) - 1,
                PageResponse.normalizePageSize(pageSize)
            ))
            .map(this::toTestCaseResponse);
        return PageResponse.fromPage(result);
    }

    @Transactional
    public ProgrammingTestCaseResponse createTestCase(String questionId, ProgrammingTestCaseRequest request) {
        AuthUserEntity user = requireTestCaseWriteRole();
        QuestionEntity question = requireProgrammingQuestion(questionId);
        classScopeService.requireCanAccessCourse(question.getCourseId());
        OffsetDateTime now = OffsetDateTime.now();

        ProgrammingTestCaseEntity entity = new ProgrammingTestCaseEntity();
        entity.setId("PTC-" + UUID.randomUUID());
        entity.setQuestion(question);
        applyTestCaseRequest(entity, request);
        entity.setCreatedBy(user.getName());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        return toTestCaseResponse(testCaseRepository.save(entity));
    }

    @Transactional
    public ProgrammingTestCaseResponse updateTestCase(String caseId, ProgrammingTestCaseRequest request) {
        requireTestCaseWriteRole();
        ProgrammingTestCaseEntity entity = testCaseRepository.findById(caseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Programming test case not found"));
        QuestionEntity question = requireProgrammingQuestion(entity.getQuestion().getId());
        classScopeService.requireCanAccessCourse(question.getCourseId());
        applyTestCaseRequest(entity, request);
        entity.setUpdatedAt(OffsetDateTime.now());
        return toTestCaseResponse(testCaseRepository.save(entity));
    }

    @Transactional
    public ProgrammingTestCaseResponse deleteTestCase(String caseId) {
        requireTestCaseWriteRole();
        ProgrammingTestCaseEntity entity = testCaseRepository.findById(caseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Programming test case not found"));
        QuestionEntity question = requireProgrammingQuestion(entity.getQuestion().getId());
        classScopeService.requireCanAccessCourse(question.getCourseId());
        ProgrammingTestCaseResponse response = toTestCaseResponse(entity);
        testCaseRepository.delete(entity);
        return response;
    }

    @Transactional
    public ProgrammingSubmissionResponse createSubmission(String examId, String answerSheetId, ProgrammingSubmissionRequest request) {
        classScopeService.requireStudentRole();
        AnswerSheetEntity answerSheet = answerSheetRepository.findWithItemsById(answerSheetId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Answer sheet not found"));
        if (!answerSheet.getExam().getId().equals(examId)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Answer sheet does not belong to this exam");
        }
        classScopeService.requireStudentOwnsAnswerSheet(answerSheet);
        OffsetDateTime now = OffsetDateTime.now();
        examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, now);
        if (answerSheet.getStatus() != com.mindmark.server.modules.answer.domain.AnswerSheetStatus.DRAFT) {
            throw new BusinessException(ErrorCode.CONFLICT, "Programming submission is only allowed for a draft answer sheet");
        }
        if (now.isBefore(answerSheet.getExam().getStartAt()) || !now.isBefore(answerSheet.getExam().getEndAt())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Programming submission is outside the exam time window");
        }

        QuestionEntity question = requireProgrammingQuestion(request.questionId());
        String paperId = answerSheet.getExam().getPaper().getId();
        if (!paperQuestionRepository.existsByPaper_IdAndQuestion_Id(paperId, question.getId())) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                "编程题不属于当前考试试卷，禁止提交评测"
            );
        }
        AnswerItemEntity answerItem = answerSheet.getItems().stream()
            .filter(item -> question.getId().equals(item.getQuestionId()))
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "Programming answer must be saved as draft before judge submission"));

        String language = normalizeLanguage(request.language());
        String sourceCode = normalizeSourceCode(request.sourceCode());

        ProgrammingJudgeSubmissionEntity submission = new ProgrammingJudgeSubmissionEntity();
        submission.setId("PJS-" + UUID.randomUUID());
        submission.setExam(answerSheet.getExam());
        submission.setAnswerSheet(answerSheet);
        submission.setAnswerItem(answerItem);
        submission.setQuestion(question);
        submission.setStudentId(answerSheet.getStudentId());
        submission.setStudentName(answerSheet.getStudentName());
        submission.setLanguage(language);
        submission.setSourceCodeSnapshot(sourceCode);
        submission.setStatus(ProgrammingJudgeStatus.QUEUED);
        submission.setScore(null);
        submission.setMaxScore(question.getScore() == null ? BigDecimal.ZERO : question.getScore());
        submission.setQueuedAt(now);
        submission.setJudgeVersion(P0_JUDGE_VERSION);
        submission.setErrorSummary("Sandbox worker is not connected yet. This P0 submission is queued for contract validation only.");

        List<ProgrammingTestCaseEntity> cases = testCaseRepository.findByQuestionIdOrderBySortOrderAscCreatedAtAsc(question.getId());
        for (ProgrammingTestCaseEntity testCase : cases) {
            ProgrammingJudgeResultEntity result = new ProgrammingJudgeResultEntity();
            result.setId("PJR-" + UUID.randomUUID());
            result.setSubmission(submission);
            result.setTestCase(testCase);
            result.setStatus(ProgrammingJudgeStatus.QUEUED);
            result.setPassed(null);
            result.setScore(null);
            result.setStderrSummary("Waiting for Sandbox worker. No student code has been executed by the main backend process.");
            result.setCreatedAt(now);
            submission.getResults().add(result);
        }

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public ProgrammingSubmissionResponse getSubmission(String submissionId) {
        ProgrammingJudgeSubmissionEntity submission = submissionRepository.findWithResultsById(submissionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Programming judge submission not found"));
        requireCanReadAnswerSheet(submission.getAnswerSheet());
        return toSubmissionResponse(submission);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProgrammingSubmissionResponse> listGradingTaskJudgeResults(String gradingTaskId, Integer page, Integer pageSize) {
        GradingTaskEntity task = gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        classScopeService.requireCanAccessExam(task.getExam());
        Page<ProgrammingSubmissionResponse> result = submissionRepository
            .findByAnswerSheetIdOrderByQueuedAtDesc(task.getAnswerSheet().getId(), PageRequest.of(
                PageResponse.normalizePage(page) - 1,
                PageResponse.normalizePageSize(pageSize)
            ))
            .map(this::toSubmissionResponse);
        return PageResponse.fromPage(result);
    }

    private void applyTestCaseRequest(ProgrammingTestCaseEntity entity, ProgrammingTestCaseRequest request) {
        entity.setTitle(requireText(request.title(), "Test case title is required"));
        entity.setInputPayload(requireText(request.inputPayload(), "Test case input is required"));
        entity.setExpectedOutput(requireText(request.expectedOutput(), "Expected output is required"));
        if (request.visibility() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Test case visibility is required");
        }
        entity.setVisibility(request.visibility());
        BigDecimal weight = request.weight() == null ? BigDecimal.ZERO : request.weight();
        if (weight.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Test case weight must be greater than or equal to 0");
        }
        entity.setWeight(weight);
        entity.setSortOrder(request.sortOrder() == null ? 0 : Math.max(request.sortOrder(), 0));
    }

    private QuestionEntity requireProgrammingQuestion(String questionId) {
        QuestionEntity question = questionRepository.findById(questionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        if (question.getType() != QuestionType.PROGRAMMING) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Only PROGRAMMING questions can use judge test cases");
        }
        return question;
    }

    private AuthUserEntity requireTestCaseWriteRole() {
        AuthUserEntity user = classScopeService.currentUser();
        if (user.getRoles().stream().noneMatch(TEST_CASE_WRITE_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Teacher, TA or admin role is required");
        }
        return user;
    }

    private void requireCanReadAnswerSheet(AnswerSheetEntity answerSheet) {
        if (classScopeService.currentUserIsStudentOnly()) {
            classScopeService.requireStudentOwnsAnswerSheet(answerSheet);
        } else {
            classScopeService.requireCanAccessExam(answerSheet.getExam());
        }
    }

    private String normalizeLanguage(String raw) {
        String language = requireText(raw, "Programming language is required").toUpperCase(Locale.ROOT);
        if ("JS".equals(language)) {
            language = "JAVASCRIPT";
        }
        if ("TS".equals(language)) {
            language = "TYPESCRIPT";
        }
        if (!LANGUAGE_WHITELIST.contains(language)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unsupported programming language: " + raw);
        }
        return language;
    }

    private String normalizeSourceCode(String raw) {
        String sourceCode = requireText(raw, "Source code is required");
        if (sourceCode.length() > MAX_SOURCE_CODE_LENGTH) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Source code is too large");
        }
        return sourceCode;
    }

    private String requireText(String raw, String message) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, message);
        }
        return raw.trim();
    }

    private ProgrammingTestCaseResponse toTestCaseResponse(ProgrammingTestCaseEntity entity) {
        return new ProgrammingTestCaseResponse(
            entity.getId(),
            entity.getQuestion().getId(),
            entity.getTitle(),
            entity.getInputPayload(),
            entity.getExpectedOutput(),
            entity.getVisibility(),
            entity.getWeight(),
            entity.getSortOrder(),
            entity.getCreatedBy(),
            stringify(entity.getCreatedAt()),
            stringify(entity.getUpdatedAt())
        );
    }

    private ProgrammingSubmissionResponse toSubmissionResponse(ProgrammingJudgeSubmissionEntity entity) {
        return new ProgrammingSubmissionResponse(
            entity.getId(),
            entity.getExam().getId(),
            entity.getAnswerSheet().getId(),
            entity.getAnswerItem() == null ? null : entity.getAnswerItem().getId(),
            entity.getQuestion().getId(),
            entity.getQuestion().getTitle(),
            entity.getStudentId(),
            entity.getStudentName(),
            entity.getLanguage(),
            entity.getStatus(),
            entity.getScore(),
            entity.getMaxScore(),
            stringify(entity.getQueuedAt()),
            stringify(entity.getStartedAt()),
            stringify(entity.getFinishedAt()),
            entity.getErrorSummary(),
            entity.getJudgeVersion(),
            entity.getResults().stream().map(this::toJudgeResultResponse).toList()
        );
    }

    private ProgrammingJudgeResultResponse toJudgeResultResponse(ProgrammingJudgeResultEntity entity) {
        ProgrammingTestCaseEntity testCase = entity.getTestCase();
        return new ProgrammingJudgeResultResponse(
            entity.getId(),
            testCase == null ? null : testCase.getId(),
            testCase == null ? null : testCase.getTitle(),
            testCase == null ? null : testCase.getVisibility(),
            entity.getStatus(),
            entity.getActualOutputSummary(),
            entity.getStderrSummary(),
            entity.getTimeMs(),
            entity.getMemoryKb(),
            entity.getPassed(),
            entity.getScore(),
            stringify(entity.getCreatedAt())
        );
    }

    private String stringify(OffsetDateTime time) {
        return time == null ? null : time.toString();
    }
}
