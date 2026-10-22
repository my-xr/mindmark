const fs=require('fs');
const s=fs.readFileSync('apps/mindmark-web/src/components/review/LectureDraftCard.vue','utf8');
console.log({hasGood:s.includes('AI 讲评稿'), hasMojibake:s.includes('璁茶瘎')});
console.log(s.slice(s.indexOf('<PageSection'), s.indexOf('<PageSection')+500).replace(/[^\x00-\x7F]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`));
