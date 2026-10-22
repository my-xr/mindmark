package com.mindmark.server.modules.exam.service;

import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.dto.ExamResponse;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ExamResponseMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public ExamResponse toResponse(ExamEntity entity) {
        return new ExamResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getPaper().getId(),
            entity.getPaper().getTitle(),
            List.copyOf(entity.getClassIds()),
            DATE_TIME_FORMATTER.format(entity.getStartAt()),
            DATE_TIME_FORMATTER.format(entity.getEndAt()),
            entity.getDurationMinutes(),
            entity.getTotalScore(),
            entity.getStatus(),
            entity.getParticipants().size(),
            countSubmitted(entity),
            entity.getCreatedBy(),
            DATE_TIME_FORMATTER.format(entity.getUpdatedAt())
        );
    }

    public ExamResponse toStudentResponse(ExamEntity entity) {
        return new ExamResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getPaper().getId(),
            entity.getPaper().getTitle(),
            List.of(),
            DATE_TIME_FORMATTER.format(entity.getStartAt()),
            DATE_TIME_FORMATTER.format(entity.getEndAt()),
            entity.getDurationMinutes(),
            entity.getTotalScore(),
            entity.getStatus(),
            0,
            0,
            null,
            DATE_TIME_FORMATTER.format(entity.getUpdatedAt())
        );
    }

    private long countSubmitted(ExamEntity entity) {
        return entity.getAnswerSheets().stream()
            .filter(answerSheet -> answerSheet.getStatus() == AnswerSheetStatus.SUBMITTED
                || answerSheet.getStatus() == AnswerSheetStatus.GRADING
                || answerSheet.getStatus() == AnswerSheetStatus.GRADED)
            .count();
    }
}
