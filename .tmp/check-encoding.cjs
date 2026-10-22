const fs=require('fs');
const s=fs.readFileSync('apps/mindmark-web/src/components/review/ReviewReportSelector.vue','utf8');
console.log({hasGood:s.includes('考试列表'), hasMojibake:s.includes('鑰冭瘯')});
const m=s.match(/title="([^"]+)/);
console.log(JSON.stringify(m && m[1]));
