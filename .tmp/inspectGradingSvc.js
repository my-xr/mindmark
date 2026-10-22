const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-web/src/services/gradingService.ts','utf8');
for (const n of ['const toQuestionGrade','const toGradingTask','export async function listGradingTasksPage','export async function autoGradeTask','export async function confirmSystemScore']) { const i=t.indexOf(n); console.log('\n--- '+n+' @ '+i); console.log(t.slice(i,i+2500)); }
