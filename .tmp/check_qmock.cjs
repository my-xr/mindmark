const fs=require('fs');
const s=fs.readFileSync('apps/mindmark-web/src/mock/questionMock.ts','utf8');
console.log(s.slice(0,800));
console.log('markers', ['锟','涓','娑','�','瀹','閺'].map(x=>[x,(s.split(x).length-1)]));
