package com.mindmark.server.modules.grading.repository;

import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingAiJobRepository extends JpaRepository<GradingAiJobEntity, String> {

    @EntityGraph(attributePaths = {"gradingTask", "gradingTask.exam", "gradingTask.exam.paper"})
    Optional<GradingAiJobEntity> findTopByGradingTaskIdOrderByCreatedAtDesc(String gradingTaskId);

    boolean existsByGradingTaskIdAndStatusIn(String gradingTaskId, Collection<GradingAiJobStatus> statuses);

    List<GradingAiJobEntity> findByStatusInOrderByCreatedAtAsc(Collection<GradingAiJobStatus> statuses);
}
