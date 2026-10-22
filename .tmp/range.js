const fs=require('fs');
const p=process.argv[2]; const start=Number(process.argv[3]||1); const end=Number(process.argv[4]||9999);
const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
for(let i=start-1;i<Math.min(lines.length,end);i++) console.log(String(i+1).padStart(4)+': '+lines[i]);
