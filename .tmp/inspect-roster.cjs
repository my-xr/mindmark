const fs=require('fs');
const s=fs.readFileSync('apps/mindmark-web/src/views/teacher/StudentRosterView.vue','utf8');
const esc=(x)=>x.replace(/[^\x00-\x7F]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
const start=s.indexOf('<template>');
console.log(esc(s.slice(start, start+5000)));
