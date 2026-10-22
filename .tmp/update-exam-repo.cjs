const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java';
let s = fs.readFileSync(path, 'utf8');
const insert = `

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
`;
if (!s.includes('pageVisibleExamsByStatus(')) {
  s = s.replace('\n\n}\n', insert + '\n\n}\n');
}
fs.writeFileSync(path, s, 'utf8');
