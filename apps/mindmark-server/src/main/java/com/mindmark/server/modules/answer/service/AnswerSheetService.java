package com.mindmark.server.modules.answer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.answer.dto.AnswerItemRequest;
import com.mindmark.server.modules.answer.dto.AnswerSheetResponse;
import com.mindmark.server.modules.answer.dto.SaveAnswerDraftRequest;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.exam.service.ExamLifecycleService;
import com.mindmark.server.modules.grading.service.GradingTaskService;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.repository.PaperRepository;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnswerSheetService {

    private final AnswerSheetRepository answerSheetRepository;
    private final AnswerSheetResponseMapper responseMapper;
    private final PaperRepository paperRepository;
    private final ObjectMapper objectMapper;
    private final GradingTaskService gradingTaskService;
    private final ClassScopeService classScopeService;
    private final ExamLifecycleService examLifecycleService;

    public AnswerSheetService(
        AnswerSheetRepository answerSheetRepository,
        AnswerSheetResponseMapper responseMapper,
        PaperRepository paperRepository,
        ObjectMapper objectMapper,
        GradingTaskService gradingTaskService,
        ClassScopeService classScopeService,
        ExamLifecycleService examLifecycleService
    ) {
        this.answerSheetRepository = answerSheetRepository;
        this.responseMapper = responseMapper;
        this.paperRepository = paperRepository;
        this.objectMapper = objectMapper;
        this.gradingTaskService = gradingTaskService;
        this.classScopeService = classScopeService;
        this.examLifecycleService = examLifecycleService;
    }

    @Transactional
    public AnswerSheetResponse getAnswerSheet(String answerSheetId) {
        AnswerSheetEntity answerSheet = findAnswerSheet(answerSheetId);
        requireCanReadAnswerSheet(answerSheet);
        examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, OffsetDateTime.now());
        return responseMapper.toResponse(answerSheet);
    }

    @Transactional
    public AnswerSheetResponse getAnswerSheetByExamAndStudent(String examId) {
        StudentProfileEntity profile = classScopeService.currentStudentProfile();
        return answerSheetRepository.findByExamIdAndStudentId(examId, profile.getId())
            .map(answerSheet -> {
                classScopeService.requireStudentOwnsAnswerSheet(answerSheet);
                examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, OffsetDateTime.now());
                return responseMapper.toResponse(answerSheet);
            })
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Answer sheet not found"));
    }

    @Transactional
    public AnswerSheetResponse saveDraft(String answerSheetId, SaveAnswerDraftRequest request) {
        AnswerSheetEntity answerSheet = findAnswerSheet(answerSheetId);
        classScopeService.requireStudentOwnsAnswerSheet(answerSheet);
        OffsetDateTime now = OffsetDateTime.now();
        ensureDraftEditable(answerSheet);
        if (!now.isBefore(answerSheet.getExam().getEndAt())) {
            AnswerSheetEntity finalized = examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, now);
            return responseMapper.toResponse(finalized);
        }
        ensureWithinAnswerWindow(answerSheet, now);
        ensureExpectedVersion(answerSheet, request);
        validateQuestionScope(answerSheet, request);

        Map<String, AnswerItemEntity> existingItems = answerSheet.getItems().stream()
            .collect(Collectors.toMap(AnswerItemEntity::getQuestionId, item -> item, (left, right) -> right, LinkedHashMap::new));

        for (AnswerItemRequest itemRequest : request.answers()) {
            AnswerItemEntity item = existingItems.get(itemRequest.questionId());
            if (item == null) {
                item = new AnswerItemEntity();
                item.setId("AI-" + UUID.randomUUID());
                item.setAnswerSheet(answerSheet);
                item.setQuestionId(itemRequest.questionId());
                answerSheet.getItems().add(item);
                existingItems.put(itemRequest.questionId(), item);
            }
            item.setAnswerJson(writeAnswerJson(itemRequest));
            item.setUpdatedAt(now);
        }

        answerSheet.setVersion(answerSheet.getVersion() + 1);
        answerSheet.setClientSavedAt(request.clientSavedAt());
        answerSheet.setUpdatedAt(now);

        return responseMapper.toResponse(answerSheetRepository.save(answerSheet));
    }

    @Transactional
    public AnswerSheetResponse submit(String answerSheetId) {
        AnswerSheetEntity answerSheet = findAnswerSheet(answerSheetId);
        classScopeService.requireStudentOwnsAnswerSheet(answerSheet);

        if (answerSheet.getStatus() == AnswerSheetStatus.SUBMITTED) {
            gradingTaskService.createTaskForSubmittedAnswerSheet(answerSheet.getId());
            return responseMapper.toResponse(answerSheet);
        }
        if (answerSheet.getStatus() == AnswerSheetStatus.GRADING
            || answerSheet.getStatus() == AnswerSheetStatus.GRADED
            || answerSheet.getStatus() == AnswerSheetStatus.ABSENT) {
            return responseMapper.toResponse(answerSheet);
        }

        OffsetDateTime now = OffsetDateTime.now();
        ensureDraftEditable(answerSheet);
        if (!now.isBefore(answerSheet.getExam().getEndAt())) {
            AnswerSheetEntity finalized = examLifecycleService.finalizeAnswerSheetIfTimedOut(answerSheet, now);
            return responseMapper.toResponse(finalized);
        }
        ensureWithinAnswerWindow(answerSheet, now);

        answerSheet.setStatus(AnswerSheetStatus.SUBMITTED);
        answerSheet.setSubmittedAt(now);
        answerSheet.setUpdatedAt(now);

        AnswerSheetEntity saved = answerSheetRepository.save(answerSheet);
        gradingTaskService.createTaskForSubmittedAnswerSheet(saved.getId());
        return responseMapper.toResponse(saved);
    }

    private void requireCanReadAnswerSheet(AnswerSheetEntity answerSheet) {
        if (classScopeService.currentUserIsStudentOnly()) {
            classScopeService.requireStudentOwnsAnswerSheet(answerSheet);
            return;
        }
        classScopeService.requireCanAccessExam(answerSheet.getExam());
    }

    private AnswerSheetEntity findAnswerSheet(String answerSheetId) {
        return answerSheetRepository.findWithItemsById(answerSheetId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Answer sheet not found"));
    }

    private void ensureDraftEditable(AnswerSheetEntity answerSheet) {
        if (answerSheet.getStatus() != AnswerSheetStatus.DRAFT) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only DRAFT answer sheets can be modified or submitted");
        }
    }

    private void ensureWithinAnswerWindow(AnswerSheetEntity answerSheet, OffsetDateTime now) {
        ExamEntity exam = answerSheet.getExam();
        refreshTimeDrivenStatus(exam, now);
        if (exam.getStatus() != ExamStatus.ONGOING || now.isBefore(exam.getStartAt()) || !now.isBefore(exam.getEndAt())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Exam is not in the answer time window");
        }
    }

    private void ensureExpectedVersion(AnswerSheetEntity answerSheet, SaveAnswerDraftRequest request) {
        if (request.expectedVersion() == null) {
            return;
        }
        if (!request.expectedVersion().equals(answerSheet.getVersion())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Answer sheet version conflict, please refresh and retry");
        }
    }

    private void refreshTimeDrivenStatus(ExamEntity exam, OffsetDateTime now) {
        if (exam.getStatus() == ExamStatus.GRADING || exam.getStatus() == ExamStatus.SCORES_PUBLISHED) {
            return;
        }
        ExamStatus expected;
        if (now.isBefore(exam.getStartAt())) {
            expected = ExamStatus.SCHEDULED;
        } else if (now.isBefore(exam.getEndAt())) {
            expected = ExamStatus.ONGOING;
        } else {
            expected = ExamStatus.ENDED;
        }
        if (exam.getStatus() != expected) {
            exam.setStatus(expected);
            exam.setUpdatedAt(now);
        }
    }

    private void validateQuestionScope(AnswerSheetEntity answerSheet, SaveAnswerDraftRequest request) {
        PaperEntity paper = paperRepository.findWithQuestionsById(answerSheet.getExam().getPaper().getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        Set<String> paperQuestionIds = paper.getQuestions().stream()
            .map(paperQuestion -> paperQuestion.getQuestion().getId())
            .collect(Collectors.toSet());
        for (AnswerItemRequest answer : request.answers()) {
            if (!paperQuestionIds.contains(answer.questionId())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Question does not belong to this exam paper: " + answer.questionId());
            }
        }
    }

    private String writeAnswerJson(AnswerItemRequest itemRequest) {
        try {
            return objectMapper.writeValueAsString(itemRequest.answer());
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid answer payload");
        }
    }
}
