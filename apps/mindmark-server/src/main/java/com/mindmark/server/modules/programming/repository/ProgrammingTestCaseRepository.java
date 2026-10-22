package com.mindmark.server.modules.programming.repository;

import com.mindmark.server.modules.programming.domain.ProgrammingTestCaseEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgrammingTestCaseRepository extends JpaRepository<ProgrammingTestCaseEntity, String> {
    Page<ProgrammingTestCaseEntity> findByQuestionIdOrderBySortOrderAscCreatedAtAsc(String questionId, Pageable pageable);
    List<ProgrammingTestCaseEntity> findByQuestionIdOrderBySortOrderAscCreatedAtAsc(String questionId);
}
