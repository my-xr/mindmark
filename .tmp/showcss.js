const fs=require('fs');
const ranges={
 'apps/mindmark-web/src/styles/teacher.css': [[1,130],[180,340],[380,520]],
 'apps/mindmark-web/src/styles/information-architecture.css': [[1,240]],
 'apps/mindmark-web/src/styles/density.css': [[120,260],[260,360]],
 'apps/mindmark-web/src/styles/components.css': [[50,105],[280,430]],
 'apps/mindmark-web/src/styles/modern.css': [[380,470]],
};
for (const [f,rs] of Object.entries(ranges)){
 console.log('\n--- '+f+' ---'); const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);
 for(const [a,b] of rs){ console.log(`--- lines ${a}-${b}`); for(let i=a;i<=Math.min(b,lines.length);i++) console.log(String(i).padStart(4)+' '+lines[i-1]);}
}
