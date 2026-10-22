const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java';
let s = fs.readFileSync(path, 'utf8');
const insert = `

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
`;
if (!s.includes('pageVisibleTasksByStatusNot(')) {
  s = s.replace('\n\n    @EntityGraph(attributePaths = {"answerSheet"})', insert + '\n\n    @EntityGraph(attributePaths = {"answerSheet"})');
}
fs.writeFileSync(path, s, 'utf8');
