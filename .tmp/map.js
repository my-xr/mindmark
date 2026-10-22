const fs=require('fs'); const t=fs.readFileSync('apps/mindmark-web/src/services/gradingService.ts','utf8'); const i=t.indexOf('const toRealGradingTask'); console.log(t.slice(i,i+1800));
