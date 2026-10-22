package com.mindmark.server.modules.ai.repository;

import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskEntity;
import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskStatus;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiQuestionGenerationTaskRepository extends JpaRepository<AiQuestionGenerationTaskEntity, String> {
    Optional<AiQuestionGenerationTaskEntity> findFirstByTeacherIdAndStatusInOrderByRequestedAtDesc(
        String teacherId,
        Collection<AiQuestionGenerationTaskStatus> statuses
    );

    Page<AiQuestionGenerationTaskEntity> findByTeacherIdOrderByRequestedAtDesc(String teacherId, Pageable pageable);
}