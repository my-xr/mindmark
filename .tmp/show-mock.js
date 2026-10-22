const fs=require('fs'); const s=fs.readFileSync('apps/mindmark-web/src/mock/questionMock.ts','utf8'); console.log(s.slice(0,1500));
