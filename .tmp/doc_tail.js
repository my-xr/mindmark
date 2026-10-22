const fs=require('fs');
for (const p of ['docs/18_页面级UI设计规范.md','docs/14_迭代计划与复盘.md','docs/11_测试验收与质量门禁.md']){
 console.log('\n---'+p+' tail---'); const lines=fs.readFileSync(p,'utf8').split(/\r?\n/); for(let i=Math.max(0,lines.length-80); i<lines.length; i++) console.log(String(i+1).padStart(4)+': '+lines[i]); }
