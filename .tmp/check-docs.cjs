const fs=require('fs');
for (const path of ['docs/18_页面级UI设计规范.md','docs/14_迭代计划与复盘.md','docs/11_测试验收与质量门禁.md']) {
 const s=fs.readFileSync(path,'utf8');
 console.log(path, {hasGood:s.includes('小范围组件化收敛'), hasMojibake:s.includes('灏忚寖')||s.includes('缁勪欢')});
}
