package com.mindmark.server.modules.review.repository;

import com.mindmark.server.modules.review.domain.LectureDraftTaskEntity;
import com.mindmark.server.modules.review.domain.LectureDraftTaskStatus;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureDraftTaskRepository extends JpaRepository<LectureDraftTaskEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper"})
    Optional<LectureDraftTaskEntity> findWithExamById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.paper"})
    Optional<LectureDraftTaskEntity> findFirstByExamIdAndStatusInOrderByRequestedAtDesc(
        String examId,
        Collection<LectureDraftTaskStatus> statuses
    );
}
