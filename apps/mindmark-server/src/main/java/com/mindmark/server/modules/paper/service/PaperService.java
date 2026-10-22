package com.mindmark.server.modules.paper.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import com.mindmark.server.modules.academic.repository.CourseRepository;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.paper.domain.PaperStatus;
import com.mindmark.server.modules.paper.dto.CreatePaperRequest;
import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;
import com.mindmark.server.modules.paper.dto.PaperComposeQualityReportResponse;
import com.mindmark.server.modules.paper.dto.PaperComposePreviewResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeDistributionItemResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeAgentPlanResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeGapResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeMode;
import com.mindmark.server.modules.paper.dto.PaperComposeRequest;
import com.mindmark.server.modules.paper.dto.PaperComposeResultResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeRuleRequest;
import com.mindmark.server.modules.paper.dto.PaperComposeStrategy;
import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;
import com.mindmark.server.modules.paper.dto.PaperResponse;
import com.mindmark.server.modules.paper.dto.PaperAnswerKeyResponse;
import com.mindmark.server.modules.paper.dto.UpdatePaperStatusRequest;
import com.mindmark.server.modules.paper.repository.PaperQuestionRepository;
import com.mindmark.server.modules.paper.repository.PaperRepository;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;
import com.mindmark.server.modules.question.repository.QuestionRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaperService {

    private static final BigDecimal DEFAULT_TARGET_SCORE = new BigDecimal("100");

    private final PaperRepository paperRepository;
    private final PaperQuestionRepository paperQuestionRepository;
    private final QuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final ExamRepository examRepository;
    private final PaperResponseMapper responseMapper;
    private final LangGraphPaperComposePlanService composePlanService;
    private final ClassScopeService classScopeService;

    public PaperService(
        PaperRepository paperRepository,
        PaperQuestionRepository paperQuestionRepository,
        QuestionRepository questionRepository,
        CourseRepository courseRepository,
        ExamRepository examRepository,
        PaperResponseMapper responseMapper,
        LangGraphPaperComposePlanService composePlanService,
        ClassScopeService classScopeService
    ) {
        this.paperRepository = paperRepository;
        this.paperQuestionRepository = paperQuestionRepository;
        this.questionRepository = questionRepository;
        this.courseRepository = courseRepository;
        this.examRepository = examRepository;
        this.responseMapper = responseMapper;
        this.composePlanService = composePlanService;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaperResponse> listPapers(String keyword, int page, int pageSize) {
        AuthUserEntity user = classScopeService.requireStaffRole();
        boolean admin = user.getRoles().contains(RoleCode.ADMIN);
        Set<String> visibleCourseIds = admin ? Set.of() : classScopeService.visibleCourseIds();
        if (!admin && visibleCourseIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }
        PageRequest pageRequest = PageRequest.of(
            Math.max(page, 1) - 1,
            Math.min(Math.max(pageSize, 1), 100),
            Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        Page<PaperEntity> paperPage = paperRepository.findAll(buildSpecification(keyword, admin, visibleCourseIds), pageRequest);

        return PageResponse.fromPage(paperPage.map(responseMapper::toResponse));
    }

    @Transactional
    public PaperResponse createPaper(CreatePaperRequest request, AuthUserEntity creator) {
        requirePaperWriteRole(creator);
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Paper payload is required");
        }
        String title = required(request.title(), "title");
        String courseId = required(request.courseId(), "courseId");
        CourseEntity course = courseRepository.findById(courseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        classScopeService.requireCanAccessCourse(courseId);

        OffsetDateTime now = OffsetDateTime.now();
        PaperEntity paper = new PaperEntity();
        paper.setId("paper-" + UUID.randomUUID());
        paper.setTitle(title);
        paper.setCourseId(course.getId());
        paper.setCourseName(course.getName());
        paper.setDescription(normalizeText(request.description(), ""));
        paper.setDurationMinutes(request.durationMinutes() == null ? 120 : request.durationMinutes());
        paper.setTotalScore(BigDecimal.ZERO);
        paper.setStatus(PaperStatus.DRAFT);
        paper.setCreatedBy(creator.getName());
        paper.setUpdatedAt(now);
        return responseMapper.toResponse(paperRepository.save(paper));
    }

    @Transactional(readOnly = true)
    public PageResponse<PaperQuestionResponse> listPaperQuestions(String paperId, int page, int pageSize) {
        PaperEntity paper = findPaperForRead(paperId);
        PageRequest pageRequest = PageRequest.of(
            Math.max(page, 1) - 1,
            Math.min(Math.max(pageSize, 1), 100),
            Sort.by(Sort.Direction.ASC, "orderIndex")
        );
        Page<PaperQuestionEntity> questionPage = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paper.getId(), pageRequest);

        boolean student = classScopeService.currentUserIsStudentOnly();
        return PageResponse.fromPage(questionPage.map(student
            ? responseMapper::toStudentPaperQuestionResponse
            : responseMapper::toPaperQuestionResponse));
    }

    @Transactional(readOnly = true)
    public PaperResponse getPaper(String paperId) {
        PaperEntity paper = findPaperForRead(paperId);
        return classScopeService.currentUserIsStudentOnly()
            ? responseMapper.toStudentResponse(paper)
            : responseMapper.toResponse(paper);
    }

    @Transactional(readOnly = true)
    public PaperAnswerKeyResponse getAnswerKey(String paperId) {
        PaperEntity paper = findPaperForRead(paperId);
        if (classScopeService.currentUserIsStudentOnly()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Students cannot access paper answer keys");
        }
        return responseMapper.toAnswerKeyResponse(paper);
    }

    @Transactional
    public void deletePaper(String paperId, AuthUserEntity operator) {
        requirePaperWriteRole(operator);
        PaperEntity paper = findPaper(paperId);
        classScopeService.requireCanAccessCourse(paper.getCourseId());
        ensurePaperEditable(paper);
        if (examRepository.existsByPaper_Id(paperId)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Paper has created exams and cannot be deleted");
        }
        paperRepository.delete(paper);
    }

    @Transactional
    public PaperResponse updateStatus(String paperId, UpdatePaperStatusRequest request) {
        PaperEntity paper = findPaper(paperId);
        requirePaperOperator(paper);
        ensurePaperEditable(paper);
        PaperStatus nextStatus = request.status();
        if (nextStatus == PaperStatus.READY && paper.getQuestions().isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Paper must contain at least one question before READY");
        }
        if (nextStatus == PaperStatus.READY) {
            ensurePaperQuestionsInCourse(paper);
        }
        paper.setStatus(nextStatus);
        paper.setUpdatedAt(OffsetDateTime.now());
        return responseMapper.toResponse(paperRepository.save(paper));
    }

    @Transactional
    public PaperResponse addQuestion(String paperId, AddPaperQuestionRequest request) {
        PaperEntity paper = findPaper(paperId);
        requirePaperOperator(paper);
        ensurePaperEditable(paper);

        boolean exists = paper.getQuestions().stream()
            .anyMatch(item -> item.getQuestion().getId().equals(request.questionId()));
        if (exists) {
            throw new BusinessException(ErrorCode.CONFLICT, "Question already exists in this paper");
        }

        QuestionEntity question = questionRepository.findById(request.questionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        if (question.getStatus() != QuestionStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only ACTIVE questions can be added to a paper");
        }
        ensureQuestionMatchesPaperCourse(paper, question);

        PaperQuestionEntity paperQuestion = createPaperQuestion(paper, question, paper.getQuestions().size() + 1, request.score());
        paper.getQuestions().add(paperQuestion);
        touchAndRecalculate(paper);

        return responseMapper.toResponse(paperRepository.save(paper));
    }

    @Transactional
    public PaperComposeResultResponse composeRandom(String paperId, PaperComposeRequest request) {
        return composePaper(paperId, request, PaperComposeStrategy.RANDOM);
    }

    @Transactional
    public PaperComposeResultResponse composeAgent(String paperId, PaperComposeRequest request) {
        return composePaper(paperId, request, PaperComposeStrategy.AGENT);
    }

    @Transactional(readOnly = true)
    public PaperComposePreviewResponse previewCompose(String paperId, PaperComposeRequest request, PaperComposeStrategy strategy) {
        PaperCompositionDraft draft = buildCompositionDraft(paperId, request, strategy);
        return new PaperComposePreviewResponse(
            draft.paper().getId(),
            draft.mode(),
            strategy,
            draft.targetScore(),
            draft.baseScore(),
            draft.ruleScore(),
            draft.plannedFinalScore(),
            draft.selectedQuestions().size(),
            draft.gaps().isEmpty(),
            draft.gaps(),
            draft.warnings(),
            draft.qualityReport(),
            draft.agentPlan()
        );
    }

    @Transactional
    public PaperResponse removeQuestion(String paperId, String questionRef) {
        PaperEntity paper = paperRepository.findById(paperId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        requirePaperOperator(paper);
        ensurePaperEditable(paper);

        List<PaperQuestionEntity> paperQuestions = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId);
        PaperQuestionEntity target = paperQuestions.stream()
            .filter(item -> item.getId().equals(questionRef) || item.getQuestion().getId().equals(questionRef))
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper question not found"));

        paperQuestionRepository.delete(target);
        paperQuestionRepository.flush();

        List<PaperQuestionEntity> remaining = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId);
        for (int index = 0; index < remaining.size(); index += 1) {
            remaining.get(index).setOrderIndex(index + 10_000);
        }
        paperQuestionRepository.saveAllAndFlush(remaining);

        BigDecimal totalScore = BigDecimal.ZERO;
        for (int index = 0; index < remaining.size(); index += 1) {
            PaperQuestionEntity item = remaining.get(index);
            item.setOrderIndex(index + 1);
            totalScore = totalScore.add(item.getScore());
        }
        paperQuestionRepository.saveAll(remaining);

        paper.setTotalScore(totalScore);
        paper.setUpdatedAt(OffsetDateTime.now());
        paperRepository.save(paper);

        return responseMapper.toResponse(findPaper(paperId));
    }

    private PaperComposeResultResponse composePaper(
        String paperId,
        PaperComposeRequest request,
        PaperComposeStrategy strategy
    ) {
        PaperCompositionDraft draft = buildCompositionDraft(paperId, request, strategy);
        if (!draft.gaps().isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, buildGapMessage(draft.paper(), draft.gaps()));
        }

        PaperEntity paper = draft.paper();
        if (draft.mode() == PaperComposeMode.REPLACE) {
            paper.getQuestions().clear();
            paperRepository.saveAndFlush(paper);
        }

        int orderIndex = paper.getQuestions().size() + 1;
        for (SelectedQuestion selectedQuestion : draft.selectedQuestions()) {
            PaperQuestionEntity paperQuestion = createPaperQuestion(
                paper,
                selectedQuestion.question(),
                orderIndex,
                selectedQuestion.score()
            );
            paper.getQuestions().add(paperQuestion);
            orderIndex += 1;
        }
        touchAndRecalculate(paper);
        PaperEntity savedPaper = paperRepository.save(paper);
        PaperComposeQualityReportResponse qualityReport = buildQualityReport(toQualityQuestionsFromPaper(savedPaper), draft.targetScore());
        PaperComposeAgentPlanResponse agentPlan = buildAgentPlan(draft, qualityReport);

        return new PaperComposeResultResponse(
            responseMapper.toResponse(savedPaper),
            draft.selectedQuestions().size(),
            draft.ruleScore(),
            draft.targetScore(),
            savedPaper.getTotalScore(),
            draft.mode(),
            strategy,
            List.of(),
            draft.warnings(),
            qualityReport,
            agentPlan
        );
    }

    private PaperCompositionDraft buildCompositionDraft(
        String paperId,
        PaperComposeRequest request,
        PaperComposeStrategy strategy
    ) {
        PaperEntity paper = findPaper(paperId);
        requirePaperOperator(paper);
        ensurePaperEditable(paper);
        ensurePaperHasCourse(paper);

        PaperComposeMode mode = request == null || request.mode() == null ? PaperComposeMode.REPLACE : request.mode();
        List<PaperComposeRuleRequest> rules = normalizeRules(request == null ? null : request.rules());
        BigDecimal ruleScore = calculateRuleScore(rules);
        BigDecimal baseScore = mode == PaperComposeMode.APPEND ? paper.getTotalScore() : BigDecimal.ZERO;
        BigDecimal plannedFinalScore = baseScore.add(ruleScore);
        BigDecimal targetScore = request == null || request.targetScore() == null ? DEFAULT_TARGET_SCORE : request.targetScore();
        if (plannedFinalScore.compareTo(targetScore) != 0) {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "组卷规则总分与目标总分不一致：当前规则完成后为 " + plannedFinalScore.stripTrailingZeros().toPlainString()
                    + " 分，目标为 " + targetScore.stripTrailingZeros().toPlainString() + " 分"
            );
        }

        Set<String> excludedQuestionIds = mode == PaperComposeMode.APPEND
            ? collectCurrentQuestionIds(paper)
            : new HashSet<>();
        List<SelectedQuestion> selectedQuestions = new ArrayList<>();
        List<PaperComposeGapResponse> gaps = new ArrayList<>();

        for (PaperComposeRuleRequest rule : rules) {
            if (rule.count() == 0) {
                continue;
            }
            List<QuestionEntity> candidates = findCandidates(paper, rule, excludedQuestionIds);
            if (candidates.size() < rule.count()) {
                gaps.add(new PaperComposeGapResponse(
                    rule.type(),
                    rule.count(),
                    candidates.size(),
                    cleanKnowledgePoints(rule.knowledgePoints()),
                    "题库可用题量不足，无法满足该题型规则"
                ));
                continue;
            }
            List<QuestionEntity> picked = selectCandidates(candidates, rule.count(), strategy);
            for (QuestionEntity question : picked) {
                excludedQuestionIds.add(question.getId());
                selectedQuestions.add(new SelectedQuestion(question, rule.score()));
            }
        }

        List<String> warnings = strategy == PaperComposeStrategy.AGENT
            ? List.of("智能组卷已按课程、题型、难度、知识点覆盖与题库库存完成后端校验后写入。")
            : List.of("随机组卷已按规则从当前课程 ACTIVE 题库抽取并写入。");
        PaperComposeQualityReportResponse qualityReport = buildQualityReport(toQualityQuestionsForDraft(paper, mode, selectedQuestions), targetScore);
        PaperComposeAgentPlanResponse agentPlan = buildAgentPlan(
            new PaperCompositionDraft(paper, mode, strategy, rules, ruleScore, baseScore, plannedFinalScore, targetScore, selectedQuestions, gaps, warnings, qualityReport, null),
            qualityReport
        );
        return new PaperCompositionDraft(
            paper,
            mode,
            strategy,
            rules,
            ruleScore,
            baseScore,
            plannedFinalScore,
            targetScore,
            selectedQuestions,
            gaps,
            warnings,
            qualityReport,
            agentPlan
        );
    }

    private List<PaperComposeRuleRequest> normalizeRules(List<PaperComposeRuleRequest> rules) {
        List<PaperComposeRuleRequest> source = rules == null || rules.isEmpty() ? defaultRules() : rules;
        List<PaperComposeRuleRequest> normalized = source.stream()
            .map(rule -> {
                if (rule.type() == null) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR, "组卷规则必须选择题型");
                }
                if (rule.count() == null || rule.count() < 0) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR, "组卷规则题量不能小于 0");
                }
                if (rule.score() == null || rule.score().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR, "组卷规则单题分值必须大于 0");
                }
                return new PaperComposeRuleRequest(
                    rule.type(),
                    rule.count(),
                    normalizeScore(rule.score()),
                    cleanDifficulties(rule.difficulties()),
                    cleanIds(rule.chapterIds()),
                    rule.chapterFromNo(),
                    rule.chapterToNo(),
                    cleanKnowledgePoints(rule.knowledgePoints())
                );
            })
            .filter(rule -> rule.count() > 0)
            .toList();
        if (normalized.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "至少需要配置一条题量大于 0 的组卷规则");
        }
        return normalized;
    }

    private List<PaperComposeRuleRequest> defaultRules() {
        return List.of(
            new PaperComposeRuleRequest(QuestionType.SINGLE_CHOICE, 20, new BigDecimal("1"), List.of(Difficulty.EASY, Difficulty.MEDIUM), List.of(), null, null, List.of()),
            new PaperComposeRuleRequest(QuestionType.MULTIPLE_CHOICE, 10, new BigDecimal("2"), List.of(Difficulty.MEDIUM, Difficulty.HARD), List.of(), null, null, List.of()),
            new PaperComposeRuleRequest(QuestionType.TRUE_FALSE, 10, new BigDecimal("1"), List.of(Difficulty.VERY_EASY, Difficulty.EASY, Difficulty.MEDIUM), List.of(), null, null, List.of()),
            new PaperComposeRuleRequest(QuestionType.FILL_BLANK, 10, new BigDecimal("1"), List.of(Difficulty.EASY, Difficulty.MEDIUM), List.of(), null, null, List.of()),
            new PaperComposeRuleRequest(QuestionType.SHORT_ANSWER, 4, new BigDecimal("5"), List.of(Difficulty.MEDIUM, Difficulty.HARD), List.of(), null, null, List.of()),
            new PaperComposeRuleRequest(QuestionType.PROGRAMMING, 2, new BigDecimal("10"), List.of(Difficulty.HARD, Difficulty.VERY_HARD), List.of(), null, null, List.of())
        );
    }

    private List<QuestionEntity> findCandidates(
        PaperEntity paper,
        PaperComposeRuleRequest rule,
        Set<String> excludedQuestionIds
    ) {
        Specification<QuestionEntity> specification = (root, criteriaQuery, criteriaBuilder) -> {
            if (criteriaQuery != null) {
                criteriaQuery.distinct(true);
            }
            ArrayList<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("courseId"), paper.getCourseId()));
            predicates.add(criteriaBuilder.equal(root.get("status"), QuestionStatus.ACTIVE));
            predicates.add(criteriaBuilder.equal(root.get("type"), rule.type()));
            if (!rule.difficulties().isEmpty()) {
                predicates.add(root.get("difficulty").in(rule.difficulties()));
            }
            if (!rule.chapterIds().isEmpty()) {
                predicates.add(root.get("chapterId").in(rule.chapterIds()));
            }
            if (rule.chapterFromNo() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("chapterNo"), rule.chapterFromNo()));
            }
            if (rule.chapterToNo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("chapterNo"), rule.chapterToNo()));
            }
            if (!excludedQuestionIds.isEmpty()) {
                predicates.add(criteriaBuilder.not(root.get("id").in(excludedQuestionIds)));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        List<String> requiredKnowledgePoints = rule.knowledgePoints();
        return questionRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt"))
            .stream()
            .filter(question -> matchesKnowledgePoints(question, requiredKnowledgePoints))
            .toList();
    }

    private List<QuestionEntity> selectCandidates(
        List<QuestionEntity> candidates,
        int count,
        PaperComposeStrategy strategy
    ) {
        List<QuestionEntity> shuffled = new ArrayList<>(candidates);
        Collections.shuffle(shuffled);
        if (strategy == PaperComposeStrategy.RANDOM) {
            return shuffled.stream().limit(count).toList();
        }

        Map<String, ArrayDeque<QuestionEntity>> buckets = new LinkedHashMap<>();
        shuffled.stream()
            .sorted(
                Comparator.comparingInt((QuestionEntity question) -> difficultyRank(question.getDifficulty()))
                    .thenComparing(question -> primaryKnowledgePoint(question).toLowerCase(Locale.ROOT))
            )
            .forEach(question -> buckets
                .computeIfAbsent(agentBucketKey(question), ignored -> new ArrayDeque<>())
                .add(question));

        List<QuestionEntity> picked = new ArrayList<>();
        while (picked.size() < count && !buckets.isEmpty()) {
            List<String> emptyKeys = new ArrayList<>();
            for (Map.Entry<String, ArrayDeque<QuestionEntity>> entry : buckets.entrySet()) {
                QuestionEntity question = entry.getValue().pollFirst();
                if (question != null) {
                    picked.add(question);
                }
                if (entry.getValue().isEmpty()) {
                    emptyKeys.add(entry.getKey());
                }
                if (picked.size() >= count) {
                    break;
                }
            }
            emptyKeys.forEach(buckets::remove);
        }
        return picked;
    }

    private boolean matchesKnowledgePoints(QuestionEntity question, List<String> requiredKnowledgePoints) {
        if (requiredKnowledgePoints == null || requiredKnowledgePoints.isEmpty()) {
            return true;
        }
        Set<String> actual = safeKnowledgePoints(question).stream()
            .map(this::normalizeText)
            .collect(LinkedHashSet::new, Set::add, Set::addAll);
        return requiredKnowledgePoints.stream()
            .map(this::normalizeText)
            .anyMatch(actual::contains);
    }

    private String buildGapMessage(PaperEntity paper, List<PaperComposeGapResponse> gaps) {
        String detail = gaps.stream()
            .map(gap -> questionTypeLabel(gap.type()) + " 需要 " + gap.requiredCount() + " 道，可用 " + gap.availableCount() + " 道")
            .reduce((left, right) -> left + "；" + right)
            .orElse("题库不足");
        return "《" + paper.getCourseName() + "》题库库存不足，无法自动组卷：" + detail + "。请先补充/审核入库题目，或降低对应题型数量。";
    }

    private BigDecimal calculateRuleScore(List<PaperComposeRuleRequest> rules) {
        return rules.stream()
            .map(rule -> rule.score().multiply(BigDecimal.valueOf(rule.count())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal normalizeScore(BigDecimal value) {
        return value.stripTrailingZeros();
    }

    private List<Difficulty> cleanDifficulties(List<Difficulty> difficulties) {
        return difficulties == null ? List.of() : difficulties.stream().distinct().toList();
    }


    private List<String> cleanIds(List<String> ids) {
        if (ids == null) {
            return List.of();
        }
        return ids.stream()
            .filter(this::hasText)
            .map(String::trim)
            .distinct()
            .toList();
    }

    private List<String> cleanKnowledgePoints(List<String> knowledgePoints) {
        if (knowledgePoints == null) {
            return List.of();
        }
        return knowledgePoints.stream()
            .filter(this::hasText)
            .map(String::trim)
            .distinct()
            .toList();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String agentBucketKey(QuestionEntity question) {
        return difficultyRank(question.getDifficulty()) + "::" + primaryKnowledgePoint(question);
    }

    private String primaryKnowledgePoint(QuestionEntity question) {
        List<String> knowledgePoints = safeKnowledgePoints(question);
        return knowledgePoints.isEmpty() ? "未标注" : knowledgePoints.get(0);
    }

    private List<String> safeKnowledgePoints(QuestionEntity question) {
        return question.getKnowledgePoints() == null ? List.of() : question.getKnowledgePoints();
    }

    private String questionTypeLabel(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case ESSAY -> "论述题";
            case CASE_ANALYSIS -> "案例分析题";
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

    private int difficultyRank(Difficulty difficulty) {
        return switch (difficulty) {
            case VERY_EASY -> 1;
            case EASY -> 2;
            case MEDIUM -> 3;
            case HARD -> 4;
            case VERY_HARD -> 5;
        };
    }

    private Set<String> collectCurrentQuestionIds(PaperEntity paper) {
        Set<String> questionIds = new HashSet<>();
        paper.getQuestions().forEach(item -> questionIds.add(item.getQuestion().getId()));
        return questionIds;
    }

    private List<QualityQuestion> toQualityQuestionsForDraft(
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
                chapterLabel(item.getQuestion()),
                safeKnowledgePoints(item.getQuestion())
            )));
        }
        selectedQuestions.forEach(item -> questions.add(new QualityQuestion(
            item.question().getType(),
            item.question().getDifficulty(),
            item.score(),
            chapterLabel(item.question()),
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
                chapterLabel(item.getQuestion()),
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
        List<PaperComposeDistributionItemResponse> chapterDistribution = buildChapterDistribution(questions, actualScore);
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
            chapterDistribution,
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


    private List<PaperComposeDistributionItemResponse> buildChapterDistribution(List<QualityQuestion> questions, BigDecimal totalScore) {
        Map<String, ScoreCounter> counters = new LinkedHashMap<>();
        questions.forEach(question -> counters.computeIfAbsent(question.chapterLabel(), ignored -> new ScoreCounter()).add(question.score()));
        return counters.entrySet().stream()
            .sorted((left, right) -> right.getValue().score().compareTo(left.getValue().score()))
            .map(entry -> distributionItem(entry.getKey(), entry.getKey(), entry.getValue(), totalScore))
            .toList();
    }

    private String chapterLabel(QuestionEntity question) {
        if (question.getChapterNo() == null && !hasText(question.getChapterTitle())) {
            return "未分章";
        }
        if (question.getChapterNo() == null) {
            return question.getChapterTitle();
        }
        return "第 " + question.getChapterNo() + " 章" + (hasText(question.getChapterTitle()) ? " · " + question.getChapterTitle() : "");
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

    private PaperQuestionEntity createPaperQuestion(
        PaperEntity paper,
        QuestionEntity question,
        int orderIndex,
        BigDecimal score
    ) {
        if (question.getStatus() != QuestionStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only ACTIVE questions can be added to a paper");
        }
        ensureQuestionMatchesPaperCourse(paper, question);

        PaperQuestionEntity paperQuestion = new PaperQuestionEntity();
        paperQuestion.setId("PQ-" + paper.getId() + "-" + question.getId());
        paperQuestion.setPaper(paper);
        paperQuestion.setQuestion(question);
        paperQuestion.setOrderIndex(orderIndex);
        paperQuestion.setScore(score);
        return paperQuestion;
    }

    private void requirePaperWriteRole(AuthUserEntity user) {
        if (user == null || user.getRoles() == null || user.getRoles().stream().noneMatch(
            role -> role == RoleCode.ADMIN || role == RoleCode.TEACHER || role == RoleCode.TA
        )) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Current user cannot manage papers");
        }
    }

    private String required(String value, String fieldName) {
        String normalized = normalizeText(value, null);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, fieldName + " is required");
        }
        return normalized;
    }

    private String normalizeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private PaperEntity findPaper(String paperId) {
        return paperRepository.findWithQuestionsById(paperId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
    }

    private void ensurePaperEditable(PaperEntity paper) {
        if (paper.getStatus() == PaperStatus.PUBLISHED || paper.getStatus() == PaperStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.CONFLICT, "Published or archived papers cannot be modified");
        }
        if (examRepository.existsByPaper_Id(paper.getId())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Papers already used by exams cannot be modified");
        }
    }

    private void ensurePaperHasCourse(PaperEntity paper) {
        if (!hasText(paper.getCourseId())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Paper must belong to a course before composing questions");
        }
    }

    private void touchAndRecalculate(PaperEntity paper) {
        paper.recalculateTotalScore();
        paper.setUpdatedAt(OffsetDateTime.now());
    }

    private void ensurePaperQuestionsInCourse(PaperEntity paper) {
        paper.getQuestions().forEach(item -> ensureQuestionMatchesPaperCourse(paper, item.getQuestion()));
    }

    private void ensureQuestionMatchesPaperCourse(PaperEntity paper, QuestionEntity question) {
        if (!hasText(question.getCourseId())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Question must belong to a course before being added to paper");
        }
        if (!hasText(paper.getCourseId())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Paper must belong to a course before adding questions");
        }
        if (!paper.getCourseId().equals(question.getCourseId())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Question course does not match paper course");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private Specification<PaperEntity> buildSpecification(
        String keyword,
        boolean admin,
        Set<String> visibleCourseIds
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            if (!admin) {
                predicates.add(root.get("courseId").in(visibleCourseIds));
            }
            if (keyword == null || keyword.isBlank()) {
                return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
            }
            String likeKeyword = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            Predicate keywordPredicate = criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likeKeyword),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("courseName")), likeKeyword),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("createdBy")), likeKeyword)
            );
            predicates.add(keywordPredicate);
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private PaperEntity findPaperForRead(String paperId) {
        PaperEntity paper = findPaper(paperId);
        if (classScopeService.currentUserIsStudentOnly()) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                "Students must load exam papers through their assigned exam"
            );
        }
        classScopeService.requireStaffRole();
        classScopeService.requireCanAccessCourse(paper.getCourseId());
        return paper;
    }

    private void requirePaperOperator(PaperEntity paper) {
        classScopeService.requireStaffRole();
        classScopeService.requireCanAccessCourse(paper.getCourseId());
    }

    private record PaperCompositionDraft(
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
        String chapterLabel,
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
}
