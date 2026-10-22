package com.mindmark.server.modules.review.repository;

import com.mindmark.server.modules.review.domain.LectureDraftEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureDraftRepository extends JpaRepository<LectureDraftEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.paper"})
    Optional<LectureDraftEntity> findFirstByExamIdOrderByUpdatedAtDesc(String examId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper"})
    List<LectureDraftEntity> findByExamIdOrderByUpdatedAtDesc(String examId);
}
