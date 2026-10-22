package com.mindmark.server.modules.score.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.score.domain.ScoreReportEntity;
import com.mindmark.server.modules.score.dto.ScoreReportResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ScoreReportMapper {

    private final ObjectMapper objectMapper;

    public ScoreReportMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ScoreReportResponse toResponse(ScoreReportEntity report) {
        return new ScoreReportResponse(
            report.getId(),
            report.getExam().getId(),
            report.getExamTitle(),
            report.getExam().getPaper().getCourseName(),
            report.getStudentId(),
            report.getStudentName(),
            className(report.getExam().getClassIds()),
            report.getExam().getTotalScore(),
            report.getScore(),
            report.getRankNo(),
            readKnowledgePoints(report.getWeakKnowledgePointsJson()),
            report.getFeedback(),
            report.getPublishedAt()
        );
    }

    private String className(List<String> classIds) {
        return classIds == null || classIds.isEmpty() ? "-" : String.join("、", classIds);
    }

    private List<String> readKnowledgePoints(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception exception) {
            return List.of();
        }
    }
}