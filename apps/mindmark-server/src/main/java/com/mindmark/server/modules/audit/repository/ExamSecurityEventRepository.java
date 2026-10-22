package com.mindmark.server.modules.audit.repository;

import com.mindmark.server.modules.audit.domain.ExamSecurityEventEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamSecurityEventRepository extends JpaRepository<ExamSecurityEventEntity, String> {

    List<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc(String examId);

    Page<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc(String examId, Pageable pageable);

    long countByExamId(String examId);
}
