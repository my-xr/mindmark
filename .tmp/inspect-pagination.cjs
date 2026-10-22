const fs=require('fs');
for (const f of ['AiQuestionsView.vue','PapersView.vue','ExamsView.vue','ReviewsView.vue']){
 const s=fs.readFileSync(`apps/mindmark-web/src/views/teacher/${f}`,'utf8');
 console.log('\n--- '+f+' imports/pagination/functions ---');
 s.split(/\n/).forEach((line,i)=>{ if(/useClientPagination|listPapers|listQuestions|listExams|listExamReviewReports|listExamSecurityEvents|pagination|loadData|loadDrafts|handle.*Pagination|EnterprisePagination/.test(line)) console.log(String(i+1).padStart(4), line); });
}
