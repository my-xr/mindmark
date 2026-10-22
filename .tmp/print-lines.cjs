const fs=require('fs');
const [file,start,end]=process.argv.slice(2); const s=fs.readFileSync(file,'utf8').split(/\n/); for(let i=Number(start)-1;i<Math.min(Number(end),s.length);i++) console.log(String(i+1).padStart(4)+' '+s[i]);
