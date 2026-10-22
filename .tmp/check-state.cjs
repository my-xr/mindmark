const fs=require('fs');
for(const p of ['apps/mindmark-web/src/views/teacher/QuestionBankView.vue','apps/mindmark-web/src/views/teacher/AiQuestionsView.vue','apps/mindmark-web/src/styles/visual-alignment.css']){
 const s=fs.readFileSync(p,'utf8');
 console.log(p, 'bad=',s.includes('\uFFFD'),'moji=',s.includes('\u951F'));
}
