from pathlib import Path
files = {}
files['apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java'] = r'''package com.mindmark.server.modules.grading.repository;

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

    @EntityGraph(attributePaths = {"answerSheet"})
    Page<GradingTaskEntity> findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
        String examId,
        GradingTaskStatus status,
        Pageable pageable
    );

    long countByExamId(String examId);

    long countByExamIdAndStatusNot(String examId, GradingTaskStatus status);
}
'''
files['apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingItemRepository.java'] = r'''package com.mindmark.server.modules.grading.repository;

import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingItemRepository extends JpaRepository<GradingItemEntity, String> {

    @EntityGraph(attributePaths = {"question"})
    Page<GradingItemEntity> findByGradingTaskIdOrderByCreatedAtAsc(String gradingTaskId, Pageable pageable);
}
'''
files['apps/mindmark-server/src/main/java/com/mindmark/server/modules/answer/repository/AnswerItemRepository.java'] = r'''package com.mindmark.server.modules.answer.repository;

import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerItemRepository extends JpaRepository<AnswerItemEntity, String> {

    List<AnswerItemEntity> findByAnswerSheetIdAndQuestionIdIn(String answerSheetId, Collection<String> questionIds);
}
'''
for file, text in files.items():
    Path(file).write_text(text, encoding='utf-8')
