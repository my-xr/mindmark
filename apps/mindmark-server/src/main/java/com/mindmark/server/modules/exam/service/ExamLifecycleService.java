package com.mindmark.server.modules.exam.service;

import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.grading.service.GradingTaskService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamLifecycleService {

    private final ExamRepository examRepository;
    private final AnswerSheetRepository answerSheetRepository;
    private final GradingTaskService gradingTaskService;

    public ExamLifecycleService(
        ExamRepository examRepository,
        AnswerSheetRepository answerSheetRepository,
        GradingTaskService gradingTaskService
    ) {
        this.examRepository = examRepository;
        this.answerSheetRepository = answerSheetRepository;
        this.gradingTaskService = gradingTaskService;
    }

    @Transactional
    public ExamEntity refreshAndFinalizeIfEnded(ExamEntity exam, OffsetDateTime now) {
        if (exam.getStatus() == ExamStatus.GRADING || exam.getStatus() == ExamStatus.SCORES_PUBLISHED) {
            return exam;
        }
        if (now.isBefore(exam.getEndAt())) {
            return exam;
        }
        return finalizeEndedExam(exam, now);
    }

    @Transactional
    public AnswerSheetEntity finalizeAnswerSheetIfTimedOut(AnswerSheetEntity answerSheet, OffsetDateTime now) {
        if (answerSheet.getStatus() != AnswerSheetStatus.DRAFT || now.isBefore(answerSheet.getExam().getEndAt())) {
            return answerSheet;
        }
        finalizeDraftAnswerSheet(answerSheet, now);
        if (answerSheet.getStatus() == AnswerSheetStatus.SUBMITTED) {
            gradingTaskService.createTaskForSubmittedAnswerSheet(answerSheet.getId());
        }
        promoteExamAfterFinalization(answerSheet.getExam(), now);
        return answerSheetRepository.save(answerSheet);
    }

    @Transactional
    public int finalizeDueExams(OffsetDateTime now) {
        List<ExamEntity> dueExams = examRepository.findByStatusInAndEndAtLessThanEqual(
            List.of(ExamStatus.SCHEDULED, ExamStatus.ONGOING, ExamStatus.ENDED),
            now
        );
        int finalized = 0;
        for (ExamEntity exam : dueExams) {
            finalizeEndedExam(exam, now);
            finalized++;
        }
        return finalized;
    }

    private ExamEntity finalizeEndedExam(ExamEntity exam, OffsetDateTime now) {
        exam.setStatus(ExamStatus.ENDED);
        exam.setUpdatedAt(now);

        List<AnswerSheetEntity> draftSheets = answerSheetRepository.findByExamIdAndStatus(exam.getId(), AnswerSheetStatus.DRAFT);
        for (AnswerSheetEntity answerSheet : draftSheets) {
            finalizeDraftAnswerSheet(answerSheet, now);
        }
        answerSheetRepository.saveAll(draftSheets);

        for (AnswerSheetEntity answerSheet : draftSheets) {
            if (answerSheet.getStatus() == AnswerSheetStatus.SUBMITTED) {
                gradingTaskService.createTaskForSubmittedAnswerSheet(answerSheet.getId());
            }
        }

        promoteExamAfterFinalization(exam, now);
        return examRepository.save(exam);
    }

    private void finalizeDraftAnswerSheet(AnswerSheetEntity answerSheet, OffsetDateTime now) {
        OffsetDateTime finalizedAt = answerSheet.getExam().getEndAt().isBefore(now) ? answerSheet.getExam().getEndAt() : now;
        if (answerSheet.getVersion() != null && answerSheet.getVersion() > 0) {
            answerSheet.setStatus(AnswerSheetStatus.SUBMITTED);
            answerSheet.setSubmittedAt(finalizedAt);
        } else {
            answerSheet.setStatus(AnswerSheetStatus.ABSENT);
            answerSheet.setSubmittedAt(null);
        }
        answerSheet.setUpdatedAt(now);
    }

    private void promoteExamAfterFinalization(ExamEntity exam, OffsetDateTime now) {
        long draftCount = answerSheetRepository.countByExamIdAndStatus(exam.getId(), AnswerSheetStatus.DRAFT);
        if (draftCount == 0 && exam.getStatus() != ExamStatus.SCORES_PUBLISHED) {
            exam.setStatus(ExamStatus.GRADING);
            exam.setUpdatedAt(now);
        }
    }
}