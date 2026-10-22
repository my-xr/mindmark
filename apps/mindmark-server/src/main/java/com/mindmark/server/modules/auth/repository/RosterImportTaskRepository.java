package com.mindmark.server.modules.auth.repository;

import com.mindmark.server.modules.auth.domain.RosterImportTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RosterImportTaskRepository extends JpaRepository<RosterImportTaskEntity, String> {
}
