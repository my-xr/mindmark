package com.mindmark.server.modules.question.repository;

import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface QuestionRepository extends JpaRepository<QuestionEntity, String>, JpaSpecificationExecutor<QuestionEntity> {

    long countBySourceAndStatus(QuestionSource source, QuestionStatus status);

    long countByCourseIdIn(Collection<String> courseIds);

    long countByCourseIdInAndSourceAndStatus(
        Collection<String> courseIds,
        QuestionSource source,
        QuestionStatus status
    );

    boolean existsByCourseIdAndTitleIgnoreCaseAndType(String courseId, String title, QuestionType type);
}
