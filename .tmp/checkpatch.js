const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java','utf8');
for(const n of ['createTaskForSubmittedAnswerSheet','setAiConfidence','setNeedsReview']) { console.log(n, t.indexOf(n)); }
const i=t.indexOf('public GradingTaskEntity createTaskForSubmittedAnswerSheet'); console.log(t.slice(i,i+500));
const j=t.indexOf('item.setAutoScore(result.score());'); console.log(t.slice(j,j+500));
