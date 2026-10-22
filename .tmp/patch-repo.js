const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/, "answerSheet\.items"/g,'');
fs.writeFileSync(p,s,'utf8');
