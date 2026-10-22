const fs=require('fs');
for (const path of ['apps/mindmark-web/src/components/review/ReviewArtifactList.vue','apps/mindmark-web/src/components/review/ReviewReportSelector.vue']) {
 const s=fs.readFileSync(path,'utf8');
 console.log(path, {good:s.includes('已生成产物')||s.includes('考试列表'), mojibake:s.includes('宸茬')||s.includes('鑰冭')});
 console.log(s.match(/title="([^"]*)"/)?.[1]);
 console.log(s.match(/description="([^"]*)"/)?.[1]);
}
