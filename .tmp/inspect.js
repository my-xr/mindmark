const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
const t=fs.readFileSync(p,'utf8');
const starts=['private void applyAutoGrade','private void gradeItem','private void confirmTaskWithSystemScore','private boolean isFailed','private BigDecimal calculate'];
for (const needle of starts) { const i=t.indexOf(needle); console.log('\n--- '+needle+' @ '+i); console.log(t.slice(Math.max(0,i), i+2500)); }
