const fs=require('fs'); const p='apps/mindmark-web/src/views/teacher/AiQuestionsView.vue'; let s=fs.readFileSync(p,'utf8'); s=s.replace(/\n  providerLabels,/, ''); fs.writeFileSync(p,s,'utf8');
