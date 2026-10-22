const fs = require('fs');
const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('existsByPaper_Id')) {
  s = s.replace(/(Optional<ExamEntity> findWithDetailsById\(String id\);\r?\n)/, '$1\n    boolean existsByPaper_Id(String paperId);\n');
}
fs.writeFileSync(p, s, 'utf8');
