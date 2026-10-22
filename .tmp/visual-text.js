const fs = require('fs');
const write = (p, s) => fs.writeFileSync(p, s.replace(/^\uFEFF/, ''), 'utf8');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const replacements = {
  'apps/mindmark-web/src/views/teacher/DashboardView.vue': [
    ['description="聚焦考试闭环关键任务，技术契约与低频说明已移出主工作区。"', 'description="聚焦今日考试闭环关键任务，减少低频说明干扰。"'],
    ['<p class="muted-text">统一主操作位置，减少同屏说明。</p>', '<p class="muted-text">按考试闭环顺序进入核心页面。</p>'],
  ],
  'apps/mindmark-web/src/views/teacher/PapersView.vue': [
    ['<p class="muted-text">当前迭代使用前端 Mock 数据。</p>', '<p class="muted-text">共 {{ papers.length }} 套试卷。</p>'],
    ['<p class="muted-text">仅展示已入库且尚未加入当前试卷的题目。</p>', '<p class="muted-text">已入库、未加入当前试卷。</p>'],
  ],
  'apps/mindmark-web/src/views/teacher/ExamsView.vue': [
    ['<p class="muted-text">\n            考试参与学生由所选教学班的真实学生名单生成，教师/助教只能选择自己有权限的班级。\n          </p>', '<p class="muted-text">默认保留一行配置；更多班级与时间项可展开。</p>'],
  ],
  'apps/mindmark-web/src/views/teacher/QuestionBankView.vue': [
    ['description="统一管理人工录入、AI 生成与批量导入的试题资源。"', 'description="检索、审核与维护可用于组卷的试题资源。"'],
  ],
};
for (const [p, list] of Object.entries(replacements)) {
  let s = read(p);
  for (const [a,b] of list) {
    if(!s.includes(a)) console.warn('missing', p, a.slice(0,80));
    s = s.replace(a,b);
  }
  write(p,s);
}
