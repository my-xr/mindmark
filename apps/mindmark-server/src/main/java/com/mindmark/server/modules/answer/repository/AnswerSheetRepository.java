package com.mindmark.server.modules.answer.repository;

import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerSheetRepository extends JpaRepository<AnswerSheetEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "items"})
    Optional<AnswerSheetEntity> findWithItemsById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "items"})
    Optional<AnswerSheetEntity> findByExamIdAndStudentId(String examId, String studentId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper"})
    List<AnswerSheetEntity> findByStudentIdOrderByUpdatedAtDesc(String studentId);

    List<AnswerSheetEntity> findByExamIdAndStatus(String examId, AnswerSheetStatus status);

    long countByExamIdAndStatus(String examId, AnswerSheetStatus status);
}

