const fs=require('fs');
for(const f of ['apps/mindmark-web/src/views/teacher/QuestionBankView.vue','apps/mindmark-web/src/views/teacher/AiQuestionsView.vue','apps/mindmark-web/src/constants/question.ts','apps/mindmark-web/src/services/questionService.ts']){
 console.log('\n---'+f+'---');
 console.log(fs.readFileSync(f,'utf8'));
}
