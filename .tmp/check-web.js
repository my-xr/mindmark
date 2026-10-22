const fs=require('fs'); const s=fs.readFileSync('apps/mindmark-web/src/views/teacher/PapersView.vue','utf8'); const i=s.indexOf('const parseKnowledgePoints'); console.log(s.slice(i,i+160));
