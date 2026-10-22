package com.mindmark.server.modules.auth.repository;

import com.mindmark.server.modules.auth.domain.TeacherClassAssignmentEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherClassAssignmentRepository extends JpaRepository<TeacherClassAssignmentEntity, String> {

    boolean existsByUserIdAndClassId(String userId, String classId);

    Optional<TeacherClassAssignmentEntity> findByUserIdAndClassId(String userId, String classId);

    List<TeacherClassAssignmentEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}