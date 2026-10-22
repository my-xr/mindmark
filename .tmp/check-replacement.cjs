const fs=require('fs');
const paths=[
'apps/mindmark-web/src/components/common/PageSection.vue',
'apps/mindmark-web/src/components/common/SummaryStrip.vue',
'apps/mindmark-web/src/components/review/LectureDraftCard.vue',
'apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue',
'apps/mindmark-web/src/components/review/ReviewArtifactList.vue',
'apps/mindmark-web/src/components/review/ReviewReportSelector.vue',
'apps/mindmark-web/src/views/teacher/ReviewsView.vue',
'apps/mindmark-web/src/views/teacher/StudentRosterView.vue',
'apps/mindmark-web/src/styles/visual-alignment.css',
'docs/18_页面级UI设计规范.md',
'docs/14_迭代计划与复盘.md',
'docs/11_测试验收与质量门禁.md',
];
for (const path of paths) {
 const s=fs.readFileSync(path,'utf8');
 if (s.includes('\uFFFD')) console.log('replacement char', path);
}
console.log('encoding scan done');
