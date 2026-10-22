package com.mindmark.server.modules.exam.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.answer.service.AnswerSheetOptionOrderService;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.repository.StudentProfileRepository;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamParticipantEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.exam.dto.CreateExamRequest;
import com.mindmark.server.modules.exam.dto.ExamResponse;
import com.mindmark.server.modules.exam.dto.StudentAnswerStatus;
import com.mindmark.server.modules.exam.dto.StudentExamResponse;
import com.mindmark.server.modules.exam.repository.ExamParticipantRepository;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperStatus;
import com.mindmark.server.modules.paper.dto.PaperResponse;
import com.mindmark.server.modules.paper.repository.PaperRepository;
import com.mindmark.server.modules.paper.service.PaperResponseMapper;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final ExamRepository examRepository;
    private final ExamParticipantRepository examParticipantRepository;
    private final PaperRepository paperRepository;
    private final AnswerSheetRepository answerSheetRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final AuthUserRepository authUserRepository;
    private final ClassScopeService classScopeService;
    private final ExamResponseMapper responseMapper;
    private final ExamLifecycleService examLifecycleService;
    private final PaperResponseMapper paperResponseMapper;
    private final AnswerSheetOptionOrderService answerSheetOptionOrderService;

    public ExamService(
        ExamRepository examRepository,
        ExamParticipantRepository examParticipantRepository,
        PaperRepository paperRepository,
        AnswerSheetRepository answerSheetRepository,
        StudentProfileRepository studentProfileRepository,
        AuthUserRepository authUserRepository,
        ClassScopeService classScopeService,
        ExamResponseMapper responseMapper,
        ExamLifecycleService examLifecycleService,
        PaperResponseMapper paperResponseMapper,
        AnswerSheetOptionOrderService answerSheetOptionOrderService
    ) {
        this.examRepository = examRepository;
        this.examParticipantRepository = examParticipantRepository;
        this.paperRepository = paperRepository;
        this.answerSheetRepository = answerSheetRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.authUserRepository = authUserRepository;
        this.classScopeService = classScopeService;
        this.responseMapper = responseMapper;
        this.examLifecycleService = examLifecycleService;
        this.paperResponseMapper = paperResponseMapper;
        this.answerSheetOptionOrderService = answerSheetOptionOrderService;
    }

    @Transactional
    public ExamResponse createExam(CreateExamRequest request) {
        PaperEntity paper = paperRepository.findWithQuestionsById(request.paperId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        ensurePaperCanCreateExam(paper);
        Integer durationMinutes = request.durationMinutes() == null ? paper.getDurationMinutes() : request.durationMinutes();
        validateTimeRange(request.startAt(), request.endAt(), durationMinutes);
        List<String> classIds = normalizeClassIds(request.classIds());
        classScopeService.requireCanAccessCourse(paper.getCourseId());
        classScopeService.requireCanManageAllClasses(classIds);
        classScopeService.requireClassesBelongToCourse(classIds, paper.getCourseId());
        AuthUserEntity currentUser = classScopeService.currentUser();

        OffsetDateTime now = OffsetDateTime.now();
        ExamEntity exam = new ExamEntity();
        exam.setId("exam-" + UUID.randomUUID());
        exam.setTitle(request.title().trim());
        exam.setPaper(paper);
        exam.setClassIds(classIds);
        exam.setStartAt(request.startAt());
        exam.setEndAt(request.endAt());
        exam.setDurationMinutes(durationMinutes);
        exam.setTotalScore(paper.getTotalScore());
        exam.setStatus(resolveTimeStatus(request.startAt(), request.endAt(), now));
        exam.setCreatedBy(currentUser.getName());
        exam.setCreatedByUserId(currentUser.getId());
        exam.setCreatedAt(now);
        exam.setUpdatedAt(now);
        if (paper.getStatus() == PaperStatus.READY) {
            paper.setStatus(PaperStatus.PUBLISHED);
            paper.setUpdatedAt(now);
        }

        createParticipantsAndAnswerSheets(exam, classIds, now, paper);

        return responseMapper.toResponse(examRepository.save(exam));
    }

    @Transactional
    public PageResponse<ExamResponse> listExams(Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        AuthUserEntity currentUser = classScopeService.currentUser();
        boolean admin = currentUser.getRoles().contains(RoleCode.ADMIN);
        Set<String> visibleClassIds = classScopeService.visibleClassIds();
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = PageRequest.of(
            PageResponse.normalizePage(page) - 1,
            PageResponse.normalizePageSize(pageSize),
            Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        OffsetDateTime now = OffsetDateTime.now();
        var examPage = examRepository.pageVisibleExams(
            admin,
            admin ? List.of("__ADMIN_SCOPE__") : visibleClassIds,
            pageRequest
        );

        return PageResponse.fromPage(examPage.map(exam -> {
            refreshTimeDrivenStatus(exam, now);
            examLifecycleService.refreshAndFinalizeIfEnded(exam, now);
            return responseMapper.toResponse(exam);
        }));
    }

    @Transactional
    public ExamResponse getExam(String examId) {
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        if (classScopeService.currentUserIsStudentOnly()) {
            classScopeService.requireStudentOwnsExam(exam);
        } else {
            classScopeService.requireCanAccessExam(exam);
        }
        OffsetDateTime now = OffsetDateTime.now();
        refreshTimeDrivenStatus(exam, now);
        examLifecycleService.refreshAndFinalizeIfEnded(exam, now);
        return classScopeService.currentUserIsStudentOnly()
            ? responseMapper.toStudentResponse(exam)
            : responseMapper.toResponse(exam);
    }

    @Transactional
    public PaperResponse getStudentPaper(String examId) {
        StudentProfileEntity profile = classScopeService.currentStudentProfile();
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireStudentOwnsExam(exam);

        OffsetDateTime now = OffsetDateTime.now();
        refreshTimeDrivenStatus(exam, now);
        if (exam.getStatus() != ExamStatus.ONGOING
            || now.isBefore(exam.getStartAt())
            || !now.isBefore(exam.getEndAt())) {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "Exam paper is available only during the answer time window"
            );
        }

        PaperEntity paper = paperRepository.findWithQuestionsById(exam.getPaper().getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        ExamParticipantEntity participant = findOrCreateParticipant(exam, profile, now);
        AnswerSheetEntity answerSheet = findOrCreateAnswerSheet(exam, participant, profile, now);
        Map<String, Map<String, String>> optionOrder =
            answerSheetOptionOrderService.ensureOptionOrder(answerSheet, paper);
        answerSheetRepository.save(answerSheet);
        return paperResponseMapper.toStudentResponse(paper, optionOrder);
    }

    @Transactional
    public List<StudentExamResponse> listStudentExams() {
        StudentProfileEntity profile = classScopeService.currentStudentProfile();
        OffsetDateTime now = OffsetDateTime.now();
        LinkedHashMap<String, ExamParticipantEntity> participantByExamId = new LinkedHashMap<>();

        examParticipantRepository.findByStudentIdOrderByCreatedAtDesc(profile.getId())
            .forEach(participant -> participantByExamId.put(participant.getExam().getId(), participant));
        examParticipantRepository.findByStudentIdOrderByCreatedAtDesc(profile.getStudentNo())
            .forEach(participant -> participantByExamId.putIfAbsent(
                participant.getExam().getId(),
                migrateLegacyParticipantStudentId(participant, profile, now)
            ));

        examRepository.findByClassIdOrderByStartAtDesc(profile.getClassId()).forEach(exam -> {
            participantByExamId.computeIfAbsent(
                exam.getId(),
                ignored -> findOrCreateParticipant(exam, profile, now)
            );
        });

        return participantByExamId.values().stream()
            .map(participant -> {
                ExamEntity exam = participant.getExam();
                refreshTimeDrivenStatus(exam, now);
                AnswerSheetEntity answerSheet = findOrCreateAnswerSheet(exam, participant, profile, now);
                examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, now);
                examLifecycleService.refreshAndFinalizeIfEnded(exam, now);
                return toStudentExamResponse(answerSheet);
            })
            .toList();
    }

    private void validateTimeRange(OffsetDateTime startAt, OffsetDateTime endAt, Integer durationMinutes) {
        if (!endAt.isAfter(startAt)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Exam endAt must be after startAt");
        }
        long windowMinutes = Duration.between(startAt, endAt).toMinutes();
        if (durationMinutes != null && durationMinutes > windowMinutes) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Exam duration must not exceed the exam time window");
        }
    }

    private List<String> normalizeClassIds(List<String> rawClassIds) {
        LinkedHashSet<String> classIds = new LinkedHashSet<>();
        if (rawClassIds != null) {
            rawClassIds.forEach(classId -> {
                if (classId != null && !classId.isBlank()) {
                    classIds.add(classId.trim());
                }
            });
        }
        if (classIds.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "classIds must not be empty");
        }
        return new ArrayList<>(classIds);
    }

    private void ensurePaperCanCreateExam(PaperEntity paper) {
        if (paper.getStatus() == PaperStatus.DRAFT || paper.getStatus() == PaperStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only READY or PUBLISHED papers can create exams");
        }
        if (paper.getQuestions().isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Paper must contain at least one question");
        }
    }

    private ExamStatus resolveTimeStatus(OffsetDateTime startAt, OffsetDateTime endAt, OffsetDateTime now) {
        if (now.isBefore(startAt)) {
            return ExamStatus.SCHEDULED;
        }
        if (now.isBefore(endAt)) {
            return ExamStatus.ONGOING;
        }
        return ExamStatus.ENDED;
    }

    private void refreshTimeDrivenStatus(ExamEntity exam, OffsetDateTime now) {
        if (exam.getStatus() == ExamStatus.GRADING || exam.getStatus() == ExamStatus.SCORES_PUBLISHED) {
            return;
        }
        ExamStatus expected = resolveTimeStatus(exam.getStartAt(), exam.getEndAt(), now);
        if (exam.getStatus() != expected) {
            exam.setStatus(expected);
            exam.setUpdatedAt(now);
        }
    }

    private ExamParticipantEntity findOrCreateParticipant(ExamEntity exam, StudentProfileEntity profile, OffsetDateTime now) {
        return examParticipantRepository.findByExamIdAndStudentId(exam.getId(), profile.getId())
            .or(() -> examParticipantRepository.findByExamIdAndStudentId(exam.getId(), profile.getStudentNo())
                .map(participant -> migrateLegacyParticipantStudentId(participant, profile, now)))
            .orElseGet(() -> createMissingParticipant(exam, profile, now));
    }

    private ExamParticipantEntity createMissingParticipant(ExamEntity exam, StudentProfileEntity profile, OffsetDateTime now) {
        ExamParticipantEntity participant = new ExamParticipantEntity();
        participant.setId("EP-" + exam.getId() + "-" + profile.getId());
        participant.setExam(exam);
        participant.setStudentId(profile.getId());
        participant.setStudentName(resolveStudentName(profile));
        participant.setClassId(profile.getClassId());
        participant.setCreatedAt(now);
        return examParticipantRepository.save(participant);
    }

    private ExamParticipantEntity migrateLegacyParticipantStudentId(
        ExamParticipantEntity participant,
        StudentProfileEntity profile,
        OffsetDateTime now
    ) {
        if (profile.getId().equals(participant.getStudentId())) {
            return participant;
        }
        participant.setStudentId(profile.getId());
        participant.setStudentName(resolveStudentName(profile));
        participant.setClassId(profile.getClassId());
        return examParticipantRepository.save(participant);
    }

    private AnswerSheetEntity findOrCreateAnswerSheet(
        ExamEntity exam,
        ExamParticipantEntity participant,
        StudentProfileEntity profile,
        OffsetDateTime now
    ) {
        AnswerSheetEntity answerSheet = answerSheetRepository.findByExamIdAndStudentId(exam.getId(), profile.getId())
            .or(() -> answerSheetRepository.findByExamIdAndStudentId(exam.getId(), profile.getStudentNo())
                .map(legacySheet -> migrateLegacyStudentId(legacySheet, profile, now)))
            .orElseGet(() -> createMissingAnswerSheet(exam, participant, now));
        PaperEntity paper = paperRepository.findWithQuestionsById(exam.getPaper().getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        answerSheetOptionOrderService.ensureOptionOrder(answerSheet, paper);
        return answerSheetRepository.save(answerSheet);
    }

    private AnswerSheetEntity migrateLegacyStudentId(AnswerSheetEntity answerSheet, StudentProfileEntity profile, OffsetDateTime now) {
        answerSheet.setStudentId(profile.getId());
        answerSheet.setStudentName(resolveStudentName(profile));
        answerSheet.setUpdatedAt(now);
        return answerSheetRepository.save(answerSheet);
    }

    private String resolveStudentName(StudentProfileEntity profile) {
        return authUserRepository.findById(profile.getUserId())
            .map(AuthUserEntity::getName)
            .orElse(profile.getStudentNo());
    }
    private AnswerSheetEntity createMissingAnswerSheet(ExamEntity exam, ExamParticipantEntity participant, OffsetDateTime now) {
        AnswerSheetEntity answerSheet = new AnswerSheetEntity();
        answerSheet.setId("AS-" + exam.getId() + "-" + participant.getStudentId());
        answerSheet.setExam(exam);
        answerSheet.setStudentId(participant.getStudentId());
        answerSheet.setStudentName(participant.getStudentName());
        answerSheet.setStatus(AnswerSheetStatus.DRAFT);
        answerSheet.setVersion(0);
        answerSheet.setStartedAt(now);
        answerSheet.setUpdatedAt(now);
        return answerSheetRepository.save(answerSheet);
    }

    private void createParticipantsAndAnswerSheets(
        ExamEntity exam,
        List<String> classIds,
        OffsetDateTime now,
        PaperEntity paper
    ) {
        LinkedHashMap<String, StudentProfileEntity> students = new LinkedHashMap<>();
        for (String classId : classIds) {
            studentProfileRepository.findByClassIdOrderByStudentNoAsc(classId)
                .forEach(profile -> students.putIfAbsent(profile.getId(), profile));
        }
        if (students.isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Target classes do not have any imported students");
        }

        for (StudentProfileEntity student : students.values()) {
            String studentName = authUserRepository.findById(student.getUserId())
                .map(AuthUserEntity::getName)
                .orElse(student.getStudentNo());

            ExamParticipantEntity participant = new ExamParticipantEntity();
            participant.setId("EP-" + exam.getId() + "-" + student.getId());
            participant.setExam(exam);
            participant.setStudentId(student.getId());
            participant.setStudentName(studentName);
            participant.setClassId(student.getClassId());
            participant.setCreatedAt(now);
            exam.getParticipants().add(participant);

            AnswerSheetEntity answerSheet = new AnswerSheetEntity();
            answerSheet.setId("AS-" + exam.getId() + "-" + student.getId());
            answerSheet.setExam(exam);
            answerSheet.setStudentId(student.getId());
            answerSheet.setStudentName(studentName);
            answerSheet.setStatus(AnswerSheetStatus.DRAFT);
            answerSheet.setVersion(0);
            answerSheet.setStartedAt(now);
            answerSheet.setUpdatedAt(now);
            answerSheetOptionOrderService.ensureOptionOrder(answerSheet, paper);
            exam.getAnswerSheets().add(answerSheet);
        }
    }

    private StudentExamResponse toStudentExamResponse(AnswerSheetEntity answerSheet) {
        ExamEntity exam = answerSheet.getExam();
        return new StudentExamResponse(
            exam.getId(),
            exam.getTitle(),
            exam.getPaper().getId(),
            exam.getPaper().getTitle(),
            exam.getClassIds(),
            DATE_TIME_FORMATTER.format(exam.getStartAt()),
            DATE_TIME_FORMATTER.format(exam.getEndAt()),
            exam.getDurationMinutes(),
            exam.getTotalScore(),
            exam.getStatus(),
            answerSheet.getId(),
            resolveAnswerStatus(answerSheet),
            answerSheet.getVersion(),
            DATE_TIME_FORMATTER.format(answerSheet.getUpdatedAt())
        );
    }

    private StudentAnswerStatus resolveAnswerStatus(AnswerSheetEntity answerSheet) {
        if (answerSheet.getStatus() == AnswerSheetStatus.GRADED) {
            return StudentAnswerStatus.GRADED;
        }
        if (answerSheet.getStatus() == AnswerSheetStatus.ABSENT) {
            return StudentAnswerStatus.ABSENT;
        }
        if (answerSheet.getStatus() == AnswerSheetStatus.SUBMITTED || answerSheet.getStatus() == AnswerSheetStatus.GRADING) {
            return StudentAnswerStatus.SUBMITTED;
        }
        return answerSheet.getVersion() == 0 ? StudentAnswerStatus.NOT_STARTED : StudentAnswerStatus.IN_PROGRESS;
    }
}
