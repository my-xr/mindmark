package com.mindmark.server.modules.paper.repository;

import com.mindmark.server.modules.paper.domain.PaperEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface PaperRepository extends JpaRepository<PaperEntity, String>, JpaSpecificationExecutor<PaperEntity> {

    @EntityGraph(attributePaths = {"questions", "questions.question", "questions.question.knowledgePoints"})
    Optional<PaperEntity> findWithQuestionsById(String id);
}