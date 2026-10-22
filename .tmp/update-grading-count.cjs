const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java';
let s = fs.readFileSync(path, 'utf8');
const insert = `

    @Query("select task.exam.id, count(task) from GradingTaskEntity task where task.exam.id in :examIds group by task.exam.id")
    List<Object[]> countByExamIds(@Param("examIds") Collection<String> examIds);
`;
if (!s.includes('countByExamIds(')) {
  s = s.replace('\n\n    long countByExamId(String examId);', insert + '\n\n    long countByExamId(String examId);');
}
fs.writeFileSync(path, s, 'utf8');
