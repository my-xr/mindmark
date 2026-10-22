const fs=require('fs');
for(const p of ['apps/mindmark-web/src/views/teacher/QuestionBankView.vue','apps/mindmark-web/src/views/teacher/AiQuestionsView.vue']){
 const s=fs.readFileSync(p,'utf8');
 console.log('\n--- '+p+' ---');
 const idx=s.indexOf('<template>');
 console.log(s.slice(idx, idx+5000));
}
