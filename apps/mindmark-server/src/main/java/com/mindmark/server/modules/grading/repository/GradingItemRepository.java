package com.mindmark.server.modules.grading.repository;

import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingItemRepository extends JpaRepository<GradingItemEntity, String> {

    @EntityGraph(attributePaths = {"question"})
    Page<GradingItemEntity> findByGradingTaskIdOrderByCreatedAtAsc(String gradingTaskId, Pageable pageable);
}
