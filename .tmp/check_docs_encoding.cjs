const fs = require('fs');
const files = [
  'docs/04_业务流程与状态机.md',
  'docs/07_领域模型与数据字典.md',
  'docs/08_API设计规范.md',
  'docs/11_测试验收与质量门禁.md',
  'docs/12_需求变更与决策记录.md',
  'docs/14_迭代计划与复盘.md',
  'docs/19_后端接口契约准备.md',
  'docs/21_考试闭环缺口分析与三轮收敛计划.md',
];
for (const f of files) {
  const b = fs.readFileSync(f);
  const s = b.toString('utf8');
  const replacement = (s.match(/\uFFFD/g) || []).length;
  const moj = ['Ã','Â','å','æ','ä','ð','�'].reduce((n, x) => n + (s.split(x).length - 1), 0);
  console.log(`${f}\t${b.length}\treplacement=${replacement}\tmojiMarkers=${moj}\tfirst=${s.slice(0, 60).replace(/\n/g,' ')}`);
}
