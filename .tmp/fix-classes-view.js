const fs = require('fs');
const p = 'apps/mindmark-web/src/views/admin/ClassesView.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('<div class="data-row data-row--head">', '<div class="data-row data-row--course data-row--head">');
s = s.replace('<div v-for="course in courses" :key="course.id" class="data-row">', '<div v-for="course in courses" :key="course.id" class="data-row data-row--course">');
fs.writeFileSync(p, s, 'utf8');
