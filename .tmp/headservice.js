const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java','utf8'); console.log(t.slice(0,9000));
