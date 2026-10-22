const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-web/src/views/teacher/GradingView.vue','utf8');
const start=t.indexOf('<template>'); console.log(t.slice(start, start+14000));
