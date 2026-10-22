package com.mindmark.server.modules.programming.repository;

import com.mindmark.server.modules.programming.domain.ProgrammingJudgeResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgrammingJudgeResultRepository extends JpaRepository<ProgrammingJudgeResultEntity, String> {
}
