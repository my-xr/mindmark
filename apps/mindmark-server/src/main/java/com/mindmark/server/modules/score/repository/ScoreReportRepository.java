package com.mindmark.server.modules.score.repository;

import com.mindmark.server.modules.score.domain.ScoreReportEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreReportRepository extends JpaRepository<ScoreReportEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.paper", "exam.classIds", "answerSheet"})
    List<ScoreReportEntity> findByStudentIdOrderByPublishedAtDesc(String studentId);

    @EntityGraph(attributePaths = {"exam", "exam.paper", "exam.classIds", "answerSheet"})
    Optional<ScoreReportEntity> findByExamIdAndStudentId(String examId, String studentId);
}