const fs = require('fs');
const files = [
'apps/mindmark-web/src/components/review/ReviewReportSelector.vue',
'apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue',
'apps/mindmark-web/src/components/review/LectureDraftCard.vue',
'apps/mindmark-web/src/components/review/ReviewArtifactList.vue',
'apps/mindmark-web/src/styles/visual-alignment.css',
'apps/mindmark-web/src/styles/admin.css',
'apps/mindmark-web/src/styles/modern.css',
'apps/mindmark-web/src/styles/density.css'
];
for (const p of files) {
 console.log('\n===== '+p+' =====');
 const s = fs.readFileSync(p, 'utf8');
 const lines=s.split(/\r?\n/);
 const max= p.endsWith('.css')? 260:500;
 for(let i=0;i<Math.min(lines.length,max);i++) console.log(String(i+1).padStart(4)+': '+lines[i]);
 if(lines.length>max) console.log('... total lines '+lines.length);
}
