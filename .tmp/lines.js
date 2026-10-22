const fs = require('fs');
for (const p of ['apps/mindmark-web/src/views/teacher/ReviewsView.vue','apps/mindmark-web/src/views/teacher/StudentRosterView.vue']) {
 console.log('\n===== '+p+' =====');
 const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
 for (let i=0;i<lines.length;i++) console.log(String(i+1).padStart(4)+': '+lines[i]);
}
