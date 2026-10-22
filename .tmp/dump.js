const fs = require('fs');
for (const p of ['apps/mindmark-web/src/views/teacher/ReviewsView.vue','apps/mindmark-web/src/views/teacher/StudentRosterView.vue']) {
 console.log('\n===== '+p+' =====');
 const s = fs.readFileSync(p, 'utf8');
 console.log(s);
}
