const fs = require('fs');
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/domain/ExamStatus.java';
let s=fs.readFileSync(p,'utf8');
s=s.replace('    ENDED,\n    SCORES_PUBLISHED', '    ENDED,\n    GRADING,\n    SCORES_PUBLISHED');
fs.writeFileSync(p,s,'utf8');
