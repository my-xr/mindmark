const fs=require('fs');
const s=fs.readFileSync('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java','utf8');
console.log('contains mojibake', s.includes('浣犳槸'), s.includes('锛'));
console.log(s.slice(s.indexOf('AI_GRADING_SYSTEM_PROMPT'), s.indexOf('AI_GRADING_SYSTEM_PROMPT')+300));
