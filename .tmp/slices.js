const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java','utf8');
for (let pos=9000; pos<t.length; pos+=4000) { console.log('\n=== slice '+pos+' ==='); console.log(t.slice(pos,pos+4000)); }
