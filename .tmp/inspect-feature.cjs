const fs=require('fs');
const files=[
'apps/mindmark-web/src/views/teacher/QuestionBankView.vue',
'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue',
'apps/mindmark-web/src/constants/question.ts',
'apps/mindmark-web/src/services/questionService.ts',
'apps/mindmark-web/src/services/aiQuestionService.ts',
'apps/mindmark-web/src/types/question.ts',
'apps/mindmark-web/src/mock/questionMock.ts',
'apps/mindmark-server/src/main/java/com/mindmark/server/modules/academic/web/AcademicController.java',
'apps/mindmark-server/src/main/java/com/mindmark/server/modules/academic/service/AcademicService.java'
];
for(const f of files){
 console.log('\n--- '+f+' ---');
 const s=fs.readFileSync(f,'utf8');
 const lines=s.split(/\r?\n/);
 lines.forEach((line,i)=>{if(/difficulty|subject|course|Course|knowledge|query|generate|listQuestions|QuestionQuery|DIFFICULTY|难度|课程|科目/i.test(line)) console.log(String(i+1).padStart(4)+': '+line);});
}
