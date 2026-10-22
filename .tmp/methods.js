const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-web/src/views/teacher/GradingView.vue','utf8'); const i=t.indexOf('const handleBatchAutoGrade'); console.log(t.slice(i-1000,i+4500));
