package com.mindmark.server.modules.academic.repository;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<CourseEntity, String> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<CourseEntity> findByCodeIgnoreCase(String code);
    List<CourseEntity> findByStatusOrderByUpdatedAtDesc(AcademicStatus status);
    List<CourseEntity> findAllByOrderByUpdatedAtDesc();
}
