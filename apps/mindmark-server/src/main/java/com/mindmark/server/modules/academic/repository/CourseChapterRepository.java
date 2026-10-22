package com.mindmark.server.modules.academic.repository;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import com.mindmark.server.modules.academic.domain.CourseChapterEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseChapterRepository extends JpaRepository<CourseChapterEntity, String> {
    @EntityGraph(attributePaths = {"course"})
    List<CourseChapterEntity> findByCourse_IdAndStatusOrderByChapterNoAsc(String courseId, AcademicStatus status);

    @EntityGraph(attributePaths = {"course"})
    List<CourseChapterEntity> findByCourse_IdOrderByChapterNoAsc(String courseId);

    Optional<CourseChapterEntity> findByCourse_IdAndChapterNo(String courseId, Integer chapterNo);

    boolean existsByCourse_IdAndChapterNo(String courseId, Integer chapterNo);
}
