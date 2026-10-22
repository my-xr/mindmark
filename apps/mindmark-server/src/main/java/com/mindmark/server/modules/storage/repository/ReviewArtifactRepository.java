package com.mindmark.server.modules.storage.repository;

import com.mindmark.server.modules.storage.domain.ReviewArtifactEntity;
import com.mindmark.server.modules.storage.domain.ReviewArtifactType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewArtifactRepository extends JpaRepository<ReviewArtifactEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper"})
    Optional<ReviewArtifactEntity> findWithExamById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper"})
    List<ReviewArtifactEntity> findByExamIdOrderByCreatedAtDesc(String examId);

    Optional<ReviewArtifactEntity> findFirstByExamIdAndArtifactTypeOrderByCreatedAtDesc(String examId, ReviewArtifactType artifactType);
}
