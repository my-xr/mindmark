package com.mindmark.server.modules.programming.repository;

import com.mindmark.server.modules.programming.domain.ProgrammingJudgeSubmissionEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgrammingJudgeSubmissionRepository extends JpaRepository<ProgrammingJudgeSubmissionEntity, String> {
    @EntityGraph(attributePaths = {"exam", "answerSheet", "answerItem", "question", "results", "results.testCase"})
    Optional<ProgrammingJudgeSubmissionEntity> findWithResultsById(String id);

    @EntityGraph(attributePaths = {"exam", "answerSheet", "answerItem", "question"})
    Page<ProgrammingJudgeSubmissionEntity> findByAnswerSheetIdOrderByQueuedAtDesc(String answerSheetId, Pageable pageable);
}
