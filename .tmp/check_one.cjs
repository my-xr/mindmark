const fs=require('fs');
const f='.tmp/doc04_fixed_preview.md';
const s=fs.readFileSync(f,'utf8');
console.log(s.slice(0,160).replace(/\r?\n/g,' '));
console.log('replacement', (s.match(/�/g)||[]).length, 'gbk-garbled-markers', ['涓','娑','锟斤'].reduce((n,x)=>n+(s.split(x).length-1),0));
