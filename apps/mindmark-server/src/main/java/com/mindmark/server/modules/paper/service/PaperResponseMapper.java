package com.mindmark.server.modules.paper.service;

import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;
import com.mindmark.server.modules.paper.dto.PaperResponse;
import com.mindmark.server.modules.paper.dto.PaperAnswerKeyItemResponse;
import com.mindmark.server.modules.paper.dto.PaperAnswerKeyResponse;
import com.mindmark.server.modules.question.service.QuestionResponseMapper;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PaperResponseMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final QuestionResponseMapper questionResponseMapper;

    public PaperResponseMapper(QuestionResponseMapper questionResponseMapper) {
        this.questionResponseMapper = questionResponseMapper;
    }

    public PaperResponse toResponse(PaperEntity entity) {
        return new PaperResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getCourseId(),
            entity.getCourseName(),
            entity.getDescription(),
            entity.getDurationMinutes(),
            entity.getTotalScore(),
            entity.getStatus(),
            distinctQuestions(entity).stream().map(this::toPaperQuestionResponse).toList(),
            entity.getCreatedBy(),
            DATE_TIME_FORMATTER.format(entity.getUpdatedAt().atZoneSameInstant(ZoneId.systemDefault()))
        );
    }

    public PaperResponse toStudentResponse(PaperEntity entity) {
        return toStudentResponse(entity, Map.of());
    }

    public PaperResponse toStudentResponse(
        PaperEntity entity,
        Map<String, Map<String, String>> optionOrderByQuestionId
    ) {
        return new PaperResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getCourseId(),
            entity.getCourseName(),
            entity.getDescription(),
            entity.getDurationMinutes(),
            entity.getTotalScore(),
            entity.getStatus(),
            distinctQuestions(entity).stream()
                .map(item -> toStudentPaperQuestionResponse(
                    item,
                    optionOrderByQuestionId.getOrDefault(item.getQuestion().getId(), Map.of())
                ))
                .toList(),
            null,
            DATE_TIME_FORMATTER.format(entity.getUpdatedAt().atZoneSameInstant(ZoneId.systemDefault()))
        );
    }

    private List<PaperQuestionEntity> distinctQuestions(PaperEntity entity) {
        return entity.getQuestions().stream()
            .collect(
                LinkedHashMap<String, PaperQuestionEntity>::new,
                (map, item) -> map.putIfAbsent(item.getId(), item),
                LinkedHashMap::putAll
            )
            .values()
            .stream()
            .toList();
    }

    public PaperQuestionResponse toPaperQuestionResponse(PaperQuestionEntity entity) {
        return new PaperQuestionResponse(
            entity.getId(),
            entity.getQuestion().getId(),
            entity.getOrderIndex(),
            entity.getScore(),
            questionResponseMapper.toResponse(entity.getQuestion())
        );
    }

    public PaperQuestionResponse toStudentPaperQuestionResponse(PaperQuestionEntity entity) {
        return toStudentPaperQuestionResponse(entity, Map.of());
    }

    public PaperQuestionResponse toStudentPaperQuestionResponse(
        PaperQuestionEntity entity,
        Map<String, String> optionOrder
    ) {
        return new PaperQuestionResponse(
            entity.getId(),
            entity.getQuestion().getId(),
            entity.getOrderIndex(),
            entity.getScore(),
            questionResponseMapper.toStudentResponse(entity.getQuestion(), optionOrder)
        );
    }

    public PaperAnswerKeyResponse toAnswerKeyResponse(PaperEntity entity) {
        return new PaperAnswerKeyResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getCourseId(),
            entity.getCourseName(),
            entity.getTotalScore(),
            DATE_TIME_FORMATTER.format(entity.getUpdatedAt().atZoneSameInstant(ZoneId.systemDefault())),
            distinctQuestions(entity).stream()
                .map(item -> new PaperAnswerKeyItemResponse(
                    item.getId(),
                    item.getQuestion().getId(),
                    item.getOrderIndex(),
                    item.getScore(),
                    questionResponseMapper.toResponse(item.getQuestion())
                ))
                .toList()
        );
    }
}

