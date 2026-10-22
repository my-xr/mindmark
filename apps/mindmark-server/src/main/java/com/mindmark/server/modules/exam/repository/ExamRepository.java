package com.mindmark.server.modules.exam.repository;

import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExamRepository extends JpaRepository<ExamEntity, String>, JpaSpecificationExecutor<ExamEntity> {

    @EntityGraph(attributePaths = {"paper", "classIds"})
    Optional<ExamEntity> findWithDetailsById(String id);

    boolean existsByPaper_Id(String paperId);

    @EntityGraph(attributePaths = {"classIds"})
    List<ExamEntity> findByPaper_Id(String paperId);

    @EntityGraph(attributePaths = {"paper", "classIds"})
    List<ExamEntity> findAllByOrderByUpdatedAtDesc();

    @EntityGraph(attributePaths = {"paper", "classIds"})
    @Query("""
        select distinct exam
        from ExamEntity exam join exam.classIds classId
        where classId = :classId
        order by exam.startAt desc, exam.updatedAt desc
        """)
    List<ExamEntity> findByClassIdOrderByStartAtDesc(@Param("classId") String classId);

    @EntityGraph(attributePaths = {"paper", "classIds"})
    List<ExamEntity> findByStatusInAndEndAtLessThanEqual(Collection<ExamStatus> statuses, OffsetDateTime endAt);

    @EntityGraph(attributePaths = {"paper"})
    @Query(
        value = """
            select exam
            from ExamEntity exam
            where exists (
                select task.id
                from GradingTaskEntity task
                where task.exam = exam
            )
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
              )
            order by exam.updatedAt desc
            """,
        countQuery = """
            select count(exam)
            from ExamEntity exam
            where exists (
                select task.id
                from GradingTaskEntity task
                where task.exam = exam
            )
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
              )
            """
    )
    Page<ExamEntity> pageVisibleExamsWithGradingTasks(
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"paper"})
    @Query(
        value = """
            select exam
            from ExamEntity exam
            where (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
            )
            order by exam.updatedAt desc
            """,
        countQuery = """
            select count(exam)
            from ExamEntity exam
            where (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
            )
            """
    )
    Page<ExamEntity> pageVisibleExams(
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"paper"})
    @Query(
        value = """
            select exam
            from ExamEntity exam
            where exam.status = :status
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
              )
            order by exam.updatedAt desc
            """,
        countQuery = """
            select count(exam)
            from ExamEntity exam
            where exam.status = :status
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
              )
            """
    )
    Page<ExamEntity> pageVisibleExamsByStatus(
        @Param("status") ExamStatus status,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @Query(
        """
            select count(exam)
            from ExamEntity exam
            where exam.status = :status
              and exists (
                select task.id
                from GradingTaskEntity task
                where task.exam = exam
              )
              and not exists (
                select unreviewedTask.id
                from GradingTaskEntity unreviewedTask
                where unreviewedTask.exam = exam
                  and unreviewedTask.status <> com.mindmark.server.modules.grading.domain.GradingTaskStatus.REVIEWED
              )
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = exam and classId not in :visibleClassIds
                )
              )
            """
    )
    long countVisibleFullyReviewedExamsByStatus(
        @Param("status") ExamStatus status,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds
    );
}
