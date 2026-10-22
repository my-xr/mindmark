package com.mindmark.server.modules.answer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.dto.AnswerItemResponse;
import com.mindmark.server.modules.answer.dto.AnswerSheetResponse;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component
public class AnswerSheetResponseMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final ObjectMapper objectMapper;

    public AnswerSheetResponseMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AnswerSheetResponse toResponse(AnswerSheetEntity entity) {
        return new AnswerSheetResponse(
            entity.getId(),
            entity.getExam().getId(),
            entity.getStudentId(),
            entity.getStudentName(),
            entity.getStatus(),
            entity.getVersion(),
            entity.getItems().stream().map(this::toAnswerItemResponse).toList(),
            format(entity.getStartedAt()),
            format(entity.getClientSavedAt()),
            format(entity.getSubmittedAt()),
            format(entity.getUpdatedAt())
        );
    }

    private AnswerItemResponse toAnswerItemResponse(AnswerItemEntity entity) {
        return new AnswerItemResponse(entity.getQuestionId(), parseJson(entity.getAnswerJson()), format(entity.getUpdatedAt()));
    }

    private JsonNode parseJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid stored answer JSON payload", exception);
        }
    }

    private String format(OffsetDateTime value) {
        return value == null ? null : DATE_TIME_FORMATTER.format(value);
    }
}
