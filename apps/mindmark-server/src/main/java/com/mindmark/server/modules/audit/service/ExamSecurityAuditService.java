package com.mindmark.server.modules.audit.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.audit.domain.ExamSecurityEventEntity;
import com.mindmark.server.modules.audit.domain.ExamSecurityEventType;
import com.mindmark.server.modules.audit.domain.ExamSecuritySeverity;
import com.mindmark.server.modules.audit.dto.ExamSecurityEventReportRequest;
import com.mindmark.server.modules.audit.dto.ExamSecurityEventResponse;
import com.mindmark.server.modules.audit.repository.ExamSecurityEventRepository;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ExamSecurityAuditService {

    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_CLIENT_EVENT_COUNT = 1000;
    private static final int MAX_USER_AGENT_LENGTH = 500;

    private final ExamRepository examRepository;
    private final AnswerSheetRepository answerSheetRepository;
    private final ExamSecurityEventRepository examSecurityEventRepository;
    private final ClassScopeService classScopeService;

    public ExamSecurityAuditService(
        ExamRepository examRepository,
        AnswerSheetRepository answerSheetRepository,
        ExamSecurityEventRepository examSecurityEventRepository,
        ClassScopeService classScopeService
    ) {
        this.examRepository = examRepository;
        this.answerSheetRepository = answerSheetRepository;
        this.examSecurityEventRepository = examSecurityEventRepository;
        this.classScopeService = classScopeService;
    }

    @Transactional
    public ExamSecurityEventResponse reportStudentEvent(
        String examId,
        ExamSecurityEventReportRequest request,
        String userAgent
    ) {
        if (request == null || request.eventType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "eventType is required");
        }
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        StudentProfileEntity profile = classScopeService.currentStudentProfile();
        classScopeService.requireStudentOwnsExam(exam);
        OffsetDateTime now = OffsetDateTime.now();
        if (now.isBefore(exam.getStartAt())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Exam has not started");
        }
        if (now.isAfter(exam.getEndAt().plusMinutes(5))) {
            throw new BusinessException(ErrorCode.CONFLICT, "Exam security reporting window has ended");
        }
        AnswerSheetEntity answerSheet = answerSheetRepository.findByExamIdAndStudentId(exam.getId(), profile.getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Answer sheet not found"));

        String message = normalize(request.message());
        String normalizedUserAgent = normalize(userAgent);
        int clientEventCount = request.clientEventCount() == null ? 1 : request.clientEventCount();
        if (clientEventCount < 1 || clientEventCount > MAX_CLIENT_EVENT_COUNT) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "clientEventCount is out of range");
        }
        if (message != null && message.length() > MAX_MESSAGE_LENGTH) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Security event message is too long");
        }
        if (normalizedUserAgent != null && normalizedUserAgent.length() > MAX_USER_AGENT_LENGTH) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "User-Agent is too long");
        }
        if (request.clientOccurredAt() != null && request.clientOccurredAt().isAfter(now.plusMinutes(5))) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "clientOccurredAt cannot be in the future");
        }

        ExamSecurityEventEntity entity = new ExamSecurityEventEntity();
        entity.setId("SE-" + UUID.randomUUID());
        entity.setExamId(exam.getId());
        entity.setAnswerSheetId(answerSheet.getId());
        entity.setStudentId(profile.getId());
        entity.setStudentName(profile.getStudentNo());
        entity.setEventType(request.eventType());
        entity.setSeverity(resolveSeverity(request.eventType()));
        entity.setMessage(message);
        entity.setClientEventCount(clientEventCount);
        entity.setClientOccurredAt(request.clientOccurredAt());
        entity.setServerReceivedAt(now);
        entity.setUserAgent(normalizedUserAgent);

        ExamSecurityEventEntity saved = examSecurityEventRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ExamSecurityEventResponse> listExamEvents(String examId) {
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);
        return examSecurityEventRepository.findByExamIdOrderByServerReceivedAtDesc(exam.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }


    @Transactional(readOnly = true)
    public PageResponse<ExamSecurityEventResponse> listExamEventsPage(String examId, Integer page, Integer pageSize) {
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);
        PageRequest pageRequest = PageRequest.of(
            PageResponse.normalizePage(page) - 1,
            PageResponse.normalizePageSize(pageSize),
            Sort.by(Sort.Direction.DESC, "serverReceivedAt")
        );
        return PageResponse.fromPage(
            examSecurityEventRepository.findByExamIdOrderByServerReceivedAtDesc(exam.getId(), pageRequest)
                .map(this::toResponse)
        );
    }

    @Transactional(readOnly = true)
    public long countExamEvents(String examId) {
        return examSecurityEventRepository.countByExamId(examId);
    }

    private ExamSecurityEventResponse toResponse(ExamSecurityEventEntity entity) {
        return new ExamSecurityEventResponse(
            entity.getId(),
            entity.getExamId(),
            entity.getAnswerSheetId(),
            entity.getStudentId(),
            entity.getStudentName(),
            entity.getEventType(),
            entity.getSeverity(),
            entity.getMessage(),
            entity.getClientEventCount(),
            entity.getClientOccurredAt(),
            entity.getServerReceivedAt(),
            entity.getUserAgent()
        );
    }

    private ExamSecuritySeverity resolveSeverity(ExamSecurityEventType eventType) {
        return switch (eventType) {
            case FULLSCREEN_EXIT, WINDOW_BLUR, VISIBILITY_HIDDEN -> ExamSecuritySeverity.MEDIUM;
            case AUTO_SUBMIT -> ExamSecuritySeverity.HIGH;
            case MANUAL_REPORT -> ExamSecuritySeverity.LOW;
        };
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

