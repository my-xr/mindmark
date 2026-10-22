const fs=require('fs');
for (const path of ['apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue','apps/mindmark-web/src/components/review/ReviewArtifactList.vue','apps/mindmark-web/src/components/review/ReviewReportSelector.vue','apps/mindmark-web/src/views/teacher/StudentRosterView.vue','apps/mindmark-web/src/views/teacher/ReviewsView.vue']){
 const s=fs.readFileSync(path,'utf8');
 console.log(path, {hasReplacement:s.includes('\uFFFD'), hasMojibake:s.includes('璁茶瘎')||s.includes('鑰冭瘯')||s.includes('瀵煎嚭'), hasGood:s.includes('考试列表')||s.includes('名单导入')||s.includes('成绩分布')||s.includes('当前复盘')});
}
