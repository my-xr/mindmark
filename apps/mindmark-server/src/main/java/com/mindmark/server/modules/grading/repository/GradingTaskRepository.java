package com.mindmark.server.modules.grading.repository;

import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GradingTaskRepository extends JpaRepository<GradingTaskEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet", "items", "items.question"})
    Optional<GradingTaskEntity> findWithItemsById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet"})
    Optional<GradingTaskEntity> findWithScopeById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet", "items", "items.question"})
    Optional<GradingTaskEntity> findByAnswerSheetId(String answerSheetId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet", "items", "items.question"})
    List<GradingTaskEntity> findByExamIdOrderByUpdatedAtDesc(String examId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet"})
    List<GradingTaskEntity> findAllByOrderByUpdatedAtDesc();


    @EntityGraph(attributePaths = {"exam", "exam.classIds", "exam.paper", "answerSheet", "items", "items.question"})
    @Query("""
        select distinct task
        from GradingTaskEntity task
        where (:examId is null or task.exam.id = :examId)
          and (:courseName is null or lower(task.exam.paper.courseName) = :courseName)
          and (
            :scoreBand is null
            or (
              task.exam.totalScore > 0
              and coalesce(task.finalScore, task.aiScore, task.objectiveScore) is not null
              and (
                (:scoreBand = 'FAILED' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 60)
                or (:scoreBand = 'S60_69' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 60 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 70)
                or (:scoreBand = 'S70_79' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 70 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 80)
                or (:scoreBand = 'S80_89' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 80 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 90)
                or (:scoreBand = 'S90_100' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 90)
              )
            )
          )          and (
            :admin = true
            or not exists (
                select classId
                from ExamEntity scopedExam join scopedExam.classIds classId
                where scopedExam = task.exam and classId not in :visibleClassIds
            )
          )
        order by task.updatedAt desc
        """)
    List<GradingTaskEntity> findVisibleTasksWithItems(
        @Param("examId") String examId,
        @Param("courseName") String courseName,
        @Param("scoreBand") String scoreBand,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds
    );

    @EntityGraph(attributePaths = {"exam", "exam.paper", "answerSheet"})
    @Query(
        value = """
            select task
            from GradingTaskEntity task
            where (:examId is null or task.exam.id = :examId)
              and (:courseName is null or lower(task.exam.paper.courseName) = :courseName)
          and (
            :scoreBand is null
            or (
              task.exam.totalScore > 0
              and coalesce(task.finalScore, task.aiScore, task.objectiveScore) is not null
              and (
                (:scoreBand = 'FAILED' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 60)
                or (:scoreBand = 'S60_69' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 60 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 70)
                or (:scoreBand = 'S70_79' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 70 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 80)
                or (:scoreBand = 'S80_89' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 80 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 90)
                or (:scoreBand = 'S90_100' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 90)
              )
            )
          )              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = task.exam and classId not in :visibleClassIds
                )
              )
            order by task.updatedAt desc
            """,
        countQuery = """
            select count(task)
            from GradingTaskEntity task
            where (:examId is null or task.exam.id = :examId)
              and (:courseName is null or lower(task.exam.paper.courseName) = :courseName)
          and (
            :scoreBand is null
            or (
              task.exam.totalScore > 0
              and coalesce(task.finalScore, task.aiScore, task.objectiveScore) is not null
              and (
                (:scoreBand = 'FAILED' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 60)
                or (:scoreBand = 'S60_69' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 60 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 70)
                or (:scoreBand = 'S70_79' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 70 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 80)
                or (:scoreBand = 'S80_89' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 80 and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 < task.exam.totalScore * 90)
                or (:scoreBand = 'S90_100' and coalesce(task.finalScore, task.aiScore, task.objectiveScore) * 100 >= task.exam.totalScore * 90)
              )
            )
          )              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = task.exam and classId not in :visibleClassIds
                )
              )
            """
    )
    Page<GradingTaskEntity> pageVisibleTasks(
        @Param("examId") String examId,
        @Param("courseName") String courseName,
        @Param("scoreBand") String scoreBand,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"exam", "exam.paper", "answerSheet"})
    @Query(
        value = """
            select task
            from GradingTaskEntity task
            where task.status <> :status
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = task.exam and classId not in :visibleClassIds
                )
              )
            order by task.updatedAt desc
            """,
        countQuery = """
            select count(task)
            from GradingTaskEntity task
            where task.status <> :status
              and (
                :admin = true
                or not exists (
                    select classId
                    from ExamEntity scopedExam join scopedExam.classIds classId
                    where scopedExam = task.exam and classId not in :visibleClassIds
                )
              )
            """
    )
    Page<GradingTaskEntity> pageVisibleTasksByStatusNot(
        @Param("status") GradingTaskStatus status,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"answerSheet"})
    Page<GradingTaskEntity> findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
        String examId,
        GradingTaskStatus status,
        Pageable pageable
    );

    @Query("select task.exam.id, count(task) from GradingTaskEntity task where task.exam.id in :examIds group by task.exam.id")
    List<Object[]> countByExamIds(@Param("examIds") Collection<String> examIds);

    long countByExamId(String examId);

    long countByExamIdAndStatusNot(String examId, GradingTaskStatus status);
}
