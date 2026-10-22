const fs = require('fs');
function write(path, content) { fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8'); }
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java', `package com.mindmark.server.modules.exam.repository;

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

    @EntityGraph(attributePaths = {"paper", "classIds"})
    List<ExamEntity> findAllByOrderByUpdatedAtDesc();

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

    @EntityGraph(attributePaths = {"paper", "classIds"})
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

    @EntityGraph(attributePaths = {"paper", "classIds"})
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
`);

write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java', `package com.mindmark.server.modules.grading.repository;

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

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "answerSheet"})
    Optional<GradingTaskEntity> findWithScopeById(String id);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "answerSheet", "items", "items.question"})
    Optional<GradingTaskEntity> findByAnswerSheetId(String answerSheetId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "answerSheet", "items", "items.question"})
    List<GradingTaskEntity> findByExamIdOrderByUpdatedAtDesc(String examId);

    @EntityGraph(attributePaths = {"exam", "exam.classIds", "answerSheet"})
    List<GradingTaskEntity> findAllByOrderByUpdatedAtDesc();

    @EntityGraph(attributePaths = {"exam", "answerSheet"})
    @Query(
        value = """
            select task
            from GradingTaskEntity task
            where (:examId is null or task.exam.id = :examId)
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
            where (:examId is null or task.exam.id = :examId)
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
    Page<GradingTaskEntity> pageVisibleTasks(
        @Param("examId") String examId,
        @Param("admin") boolean admin,
        @Param("visibleClassIds") Collection<String> visibleClassIds,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"exam", "answerSheet"})
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
`);
