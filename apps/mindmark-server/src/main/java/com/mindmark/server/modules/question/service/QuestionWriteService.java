package com.mindmark.server.modules.question.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import com.mindmark.server.modules.academic.domain.CourseChapterEntity;
import com.mindmark.server.modules.academic.repository.CourseRepository;
import com.mindmark.server.modules.academic.repository.CourseChapterRepository;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.ai.dto.QuestionImportRequest;
import com.mindmark.server.modules.ai.dto.QuestionImportResponse;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.service.AuthAuditService;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionReviewAction;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.dto.MarkdownQuestionImportRequest;
import com.mindmark.server.modules.question.dto.MarkdownQuestionImportResponse;
import com.mindmark.server.modules.question.dto.QuestionDeleteResponse;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import com.mindmark.server.modules.question.dto.QuestionReviewRequest;
import com.mindmark.server.modules.question.repository.QuestionRepository;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.paper.domain.PaperStatus;
import com.mindmark.server.modules.paper.repository.PaperQuestionRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionWriteService {

    private static final BigDecimal DEFAULT_SCORE = BigDecimal.valueOf(2);

    private final QuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final CourseChapterRepository courseChapterRepository;
    private final PaperQuestionRepository paperQuestionRepository;
    private final ExamRepository examRepository;
    private final QuestionResponseMapper responseMapper;
    private final ObjectMapper objectMapper;
    private final AuthAuditService authAuditService;
    private final MarkdownQuestionParser markdownQuestionParser;
    private final ClassScopeService classScopeService;

    public QuestionWriteService(
        QuestionRepository questionRepository,
        CourseRepository courseRepository,
        CourseChapterRepository courseChapterRepository,
        PaperQuestionRepository paperQuestionRepository,
        ExamRepository examRepository,
        QuestionResponseMapper responseMapper,
        ObjectMapper objectMapper,
        AuthAuditService authAuditService,
        MarkdownQuestionParser markdownQuestionParser,
        ClassScopeService classScopeService
    ) {
        this.questionRepository = questionRepository;
        this.courseRepository = courseRepository;
        this.courseChapterRepository = courseChapterRepository;
        this.paperQuestionRepository = paperQuestionRepository;
        this.examRepository = examRepository;
        this.responseMapper = responseMapper;
        this.objectMapper = objectMapper;
        this.authAuditService = authAuditService;
        this.markdownQuestionParser = markdownQuestionParser;
        this.classScopeService = classScopeService;
    }

    @Transactional
    public QuestionResponse createManualQuestion(QuestionCreateRequest request, String createdBy) {
        classScopeService.requireCanAccessCourse(request == null ? null : request.courseId());
        return responseMapper.toResponse(createQuestion(request, QuestionSource.MANUAL, QuestionStatus.ACTIVE, createdBy));
    }

    @Transactional
    public QuestionImportResponse importQuestions(QuestionImportRequest request, String createdBy) {
        List<QuestionCreateRequest> questions = request == null || request.questions() == null
            ? List.of()
            : request.questions();
        questions.forEach(item -> classScopeService.requireCanAccessCourse(item == null ? null : item.courseId()));
        List<QuestionResponse> imported = questions.stream()
            .map(item -> createQuestion(item, QuestionSource.IMPORT, QuestionStatus.ACTIVE, createdBy))
            .map(responseMapper::toResponse)
            .toList();
        return new QuestionImportResponse(imported.size(), 0, imported);
    }

    @Transactional
    public MarkdownQuestionImportResponse importMarkdownQuestions(MarkdownQuestionImportRequest request, AuthUserEntity importer) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Markdown import payload is required");
        }
        String courseId = normalize(request.courseId());
        if (courseId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "courseId is required");
        }
        CourseEntity course = courseRepository.findById(courseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        classScopeService.requireCanAccessCourse(courseId);
        MarkdownQuestionParser.ParseResult parseResult = markdownQuestionParser.parse(
            request.markdown(),
            course.getId(),
            course.getName(),
            request.chapterId()
        );
        List<String> warnings = new ArrayList<>(parseResult.warnings());
        List<QuestionResponse> imported = new ArrayList<>();
        int skippedCount = 0;
        for (MarkdownQuestionParser.ParsedQuestion parsedQuestion : parseResult.questions()) {
            QuestionCreateRequest item = parsedQuestion.request();
            if (questionRepository.existsByCourseIdAndTitleIgnoreCaseAndType(item.courseId(), item.title(), item.type())) {
                skippedCount += 1;
                warnings.add("跳过重复题目：" + parsedQuestion.sourceNo());
                continue;
            }
            imported.add(responseMapper.toResponse(createQuestion(item, QuestionSource.IMPORT, QuestionStatus.ACTIVE, importer.getName())));
        }
        authAuditService.record(
            importer.getId(),
            "QUESTION_MARKDOWN_IMPORT",
            course.getId(),
            "SUCCESS",
            "fileName=" + normalize(request.fileName())
                + ", parsed=" + parseResult.questions().size()
                + ", imported=" + imported.size()
                + ", skipped=" + skippedCount
        );
        return new MarkdownQuestionImportResponse(
            parseResult.questions().size(),
            imported.size(),
            skippedCount,
            warnings,
            imported
        );
    }

    @Transactional
    public List<QuestionResponse> createAiQuestions(
        List<QuestionCreateRequest> generatedQuestions,
        String teacherId,
        String createdBy
    ) {
        generatedQuestions.forEach(item -> classScopeService.requireUserCanAccessCourse(
            teacherId,
            item == null ? null : item.courseId()
        ));
        return generatedQuestions.stream()
            .map(item -> createQuestion(item, QuestionSource.AI, QuestionStatus.PENDING_REVIEW, createdBy))
            .map(responseMapper::toResponse)
            .toList();
    }

    @Transactional
    public QuestionResponse reviewAiQuestion(String questionId, QuestionReviewRequest request, AuthUserEntity reviewer) {
        if (request == null || request.action() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "review action is required");
        }
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        classScopeService.requireCanAccessCourse(entity.getCourseId());
        if (entity.getSource() != QuestionSource.AI) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only AI generated questions can be reviewed");
        }
        if (entity.getStatus() != QuestionStatus.PENDING_REVIEW) {
            throw new BusinessException(ErrorCode.CONFLICT, "Question is not waiting for review");
        }

        QuestionReviewAction action = request.action();
        OffsetDateTime now = OffsetDateTime.now();
        String comment = normalize(request.comment());
        if (comment == null && action == QuestionReviewAction.EDITED_ACCEPTED) {
            comment = "Teacher confirmed the generated question after manual edits";
        }

        entity.setReviewedBy(reviewer.getName());
        entity.setReviewedAt(now);
        entity.setReviewAction(action);
        entity.setReviewComment(comment);
        entity.setStatus(action == QuestionReviewAction.REJECTED ? QuestionStatus.REJECTED : QuestionStatus.ACTIVE);
        entity.setUpdatedAt(now);

        QuestionEntity saved = questionRepository.save(entity);
        authAuditService.record(
            reviewer.getId(),
            "AI_QUESTION_REVIEW",
            saved.getId(),
            "SUCCESS",
            "action=" + action + ", status=" + saved.getStatus() + (comment == null ? "" : ", comment=" + comment)
        );
        return responseMapper.toResponse(saved);
    }

    @Transactional
    public QuestionDeleteResponse deleteQuestion(String questionId, AuthUserEntity operator) {
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        classScopeService.requireCanAccessCourse(entity.getCourseId());
        List<PaperQuestionEntity> references = paperQuestionRepository.findByQuestion_Id(entity.getId());
        long lockedReferenceCount = references.stream()
            .filter(reference -> isLockedPaperReference(reference.getPaper()))
            .count();

        if (lockedReferenceCount > 0) {
            int removedEditableReferences = removeEditablePaperReferences(references);
            entity.setStatus(QuestionStatus.DISABLED);
            entity.setUpdatedAt(OffsetDateTime.now());
            QuestionEntity saved = questionRepository.save(entity);
            authAuditService.record(
                operator.getId(),
                "QUESTION_DISABLE",
                saved.getId(),
                "SUCCESS",
                "lockedReferences=" + lockedReferenceCount + ", removedEditableReferences=" + removedEditableReferences
            );
            return new QuestionDeleteResponse(
                saved.getId(),
                false,
                saved.getStatus(),
                removedEditableReferences > 0
                    ? "题目已从未锁定试卷中移除；因仍存在已发布/归档试卷引用，系统已停用题目并保留历史记录。"
                    : "题目已被已发布/归档试卷引用，系统已停用题目并保留历史记录。"
            );
        }

        int removedReferences = removeEditablePaperReferences(references);
        questionRepository.delete(entity);
        authAuditService.record(
            operator.getId(),
            "QUESTION_DELETE",
            entity.getId(),
            "SUCCESS",
            "physical=true, removedPaperReferences=" + removedReferences
        );
        return new QuestionDeleteResponse(
            entity.getId(),
            true,
            null,
            removedReferences > 0 ? "题目及其未锁定试卷引用已删除。" : "题目已删除。"
        );
    }

    private int removeEditablePaperReferences(List<PaperQuestionEntity> references) {
        if (references.isEmpty()) {
            return 0;
        }

        Map<String, PaperEntity> affectedPapers = new LinkedHashMap<>();
        int removed = 0;
        for (PaperQuestionEntity reference : references) {
            PaperEntity paper = reference.getPaper();
            if (isLockedPaperReference(paper)) {
                continue;
            }
            affectedPapers.put(paper.getId(), paper);
            paperQuestionRepository.delete(reference);
            removed += 1;
        }
        paperQuestionRepository.flush();

        for (Map.Entry<String, PaperEntity> affectedPaper : affectedPapers.entrySet()) {
            List<PaperQuestionEntity> remaining = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(affectedPaper.getKey());
            BigDecimal totalScore = BigDecimal.ZERO;
            for (int index = 0; index < remaining.size(); index += 1) {
                PaperQuestionEntity item = remaining.get(index);
                item.setOrderIndex(index + 1);
                totalScore = totalScore.add(item.getScore());
            }
            PaperEntity paper = affectedPaper.getValue();
            paper.setTotalScore(totalScore);
            paper.setUpdatedAt(OffsetDateTime.now());
            paperQuestionRepository.saveAll(remaining);
        }

        return removed;
    }

    private boolean isLockedPaperReference(PaperEntity paper) {
        return paper.getStatus() == PaperStatus.PUBLISHED
            || paper.getStatus() == PaperStatus.ARCHIVED
            || examRepository.existsByPaper_Id(paper.getId());
    }

    @Transactional
    public QuestionResponse updateQuestion(String questionId, QuestionCreateRequest request, AuthUserEntity editor) {
        validateRequest(request);
        QuestionEntity entity = questionRepository.findById(normalize(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        classScopeService.requireCanAccessCourse(entity.getCourseId());
        classScopeService.requireCanAccessCourse(request.courseId());
        boolean locked = paperQuestionRepository.findByQuestion_Id(entity.getId()).stream()
            .map(PaperQuestionEntity::getPaper)
            .anyMatch(this::isLockedPaperReference);
        if (locked) {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "Question is referenced by a used or locked paper and cannot be edited"
            );
        }
        CourseEntity course = courseRepository.findById(normalize(request.courseId()))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        CourseChapterEntity chapter = resolveChapter(course.getId(), request.chapterId());

        entity.setTitle(required(request.title(), "title"));
        entity.setType(request.type());
        entity.setDifficulty(request.difficulty());
        entity.setCourseId(course.getId());
        entity.setCourseName(course.getName());
        applyChapter(entity, chapter);
        entity.setKnowledgePoints(normalizeKnowledgePoints(request.knowledgePoints()));
        entity.setScore(request.score() == null ? DEFAULT_SCORE : request.score());
        entity.setAnswerJson(toJson(request.answer(), "answer"));
        entity.setAnalysis(required(request.analysis(), "analysis"));
        entity.setOptionsJson(toJson(request.options(), "options"));
        entity.setScoringPointsJson(toJson(request.scoringPoints(), "scoringPoints"));
        if (entity.getSource() == QuestionSource.AI && entity.getStatus() == QuestionStatus.REJECTED) {
            entity.setStatus(QuestionStatus.PENDING_REVIEW);
            entity.setReviewAction(null);
            entity.setReviewComment("Rejected AI question edited and resubmitted for review");
            entity.setReviewedBy(null);
            entity.setReviewedAt(null);
        }
        entity.setUpdatedAt(OffsetDateTime.now());

        QuestionEntity saved = questionRepository.save(entity);
        authAuditService.record(
            editor.getId(),
            "QUESTION_UPDATE",
            saved.getId(),
            "SUCCESS",
            "source=" + saved.getSource() + ", status=" + saved.getStatus()
        );
        return responseMapper.toResponse(saved);
    }

    private QuestionEntity createQuestion(
        QuestionCreateRequest request,
        QuestionSource source,
        QuestionStatus status,
        String createdBy
    ) {
        validateRequest(request);
        CourseEntity course = courseRepository.findById(normalize(request.courseId()))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        CourseChapterEntity chapter = resolveChapter(course.getId(), request.chapterId());
        OffsetDateTime now = OffsetDateTime.now();
        QuestionEntity entity = new QuestionEntity();
        entity.setId("Q-" + UUID.randomUUID());
        entity.setTitle(required(request.title(), "title"));
        entity.setType(request.type());
        entity.setDifficulty(request.difficulty());
        entity.setCourseId(course.getId());
        entity.setCourseName(course.getName());
        applyChapter(entity, chapter);
        entity.setKnowledgePoints(normalizeKnowledgePoints(request.knowledgePoints()));
        entity.setSource(source);
        entity.setStatus(status);
        entity.setScore(request.score() == null ? DEFAULT_SCORE : request.score());
        entity.setAnswerJson(toJson(request.answer(), "answer"));
        entity.setAnalysis(required(request.analysis(), "analysis"));
        entity.setOptionsJson(toJson(request.options(), "options"));
        entity.setScoringPointsJson(toJson(request.scoringPoints(), "scoringPoints"));
        entity.setCreatedBy(required(createdBy, "createdBy"));
        entity.setUpdatedAt(now);
        return questionRepository.save(entity);
    }


    private CourseChapterEntity resolveChapter(String courseId, String chapterId) {
        String normalizedChapterId = normalize(chapterId);
        if (normalizedChapterId != null) {
            CourseChapterEntity chapter = courseChapterRepository.findById(normalizedChapterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course chapter not found"));
            if (chapter.getCourse() == null || !courseId.equals(chapter.getCourse().getId())) {
                throw new BusinessException(ErrorCode.CONFLICT, "Question chapter does not match course");
            }
            return chapter;
        }
        return courseChapterRepository.findByCourse_IdAndChapterNo(courseId, 0)
            .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "chapterId is required"));
    }

    private void applyChapter(QuestionEntity entity, CourseChapterEntity chapter) {
        entity.setChapterId(chapter.getId());
        entity.setChapterNo(chapter.getChapterNo());
        entity.setChapterTitle(chapter.getTitle());
    }

    private void validateRequest(QuestionCreateRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Question payload is required");
        }
        required(request.courseId(), "courseId");
        required(request.title(), "title");
        if (request.type() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "type is required");
        }
        if (request.difficulty() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "difficulty is required");
        }
        if (request.score() != null && request.score().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "score must be greater than or equal to 0");
        }
    }

    private List<String> normalizeKnowledgePoints(List<String> values) {
        if (values == null) {
            return List.of();
        }
        Set<String> deduped = new LinkedHashSet<>();
        values.stream()
            .map(this::normalize)
            .filter(value -> value != null)
            .forEach(deduped::add);
        return new ArrayList<>(deduped);
    }

    private String toJson(JsonNode value, String fieldName) {
        if (value == null || value.isNull()) {
            if ("options".equals(fieldName) || "scoringPoints".equals(fieldName)) {
                return "[]";
            }
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, fieldName + " is required");
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid JSON field: " + fieldName);
        }
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
}

