package com.mindmark.server.modules.academic.repository;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import com.mindmark.server.modules.academic.domain.TeachingClassEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeachingClassRepository extends JpaRepository<TeachingClassEntity, String> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<TeachingClassEntity> findByCodeIgnoreCase(String code);
    @EntityGraph(attributePaths = {"course"})
    List<TeachingClassEntity> findByStatusOrderByUpdatedAtDesc(AcademicStatus status);
    @EntityGraph(attributePaths = {"course"})
    List<TeachingClassEntity> findByIdInAndStatusOrderByUpdatedAtDesc(Collection<String> ids, AcademicStatus status);
    @EntityGraph(attributePaths = {"course"})
    List<TeachingClassEntity> findAllByOrderByUpdatedAtDesc();
}
