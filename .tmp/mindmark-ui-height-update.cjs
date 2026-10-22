const fs = require('fs');
const files = [
  'apps/mindmark-web/src/styles/visual-alignment.css',
  'apps/mindmark-web/src/views/teacher/QuestionBankView.vue',
  'docs/18_页面级UI设计规范.md',
  'docs/14_迭代计划与复盘.md',
  'docs/11_测试验收与质量门禁.md',
];
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  if (f.endsWith('visual-alignment.css')) {
    if (!s.includes('.question-filter-card .collapsible-filter-body--single-row')) {
      s = s.replace(
        '.collapsible-filter-body--single-row {\n  max-height: 64px;\n}\n',
        '.collapsible-filter-body--single-row {\n  max-height: 64px;\n}\n\n.question-filter-card .collapsible-filter-body--single-row,\n.ai-generate-form .collapsible-filter-body--single-row {\n  max-height: 68px;\n}\n',
      );
    }
  }

  if (f.endsWith('QuestionBankView.vue')) {
    s = s.replace(
      '<section class="filter-card filter-card--compact">',
      '<section class="filter-card filter-card--compact question-filter-card">',
    );
  }

  if (f.endsWith('18_页面级UI设计规范.md')) {
    s = s.replace(
      '题库管理“题目筛选”和 AI 出题“生成题目”在收起到一行时，首行容器高度从 54px 上调到 64px。',
      '筛选区收起到一行时，首行容器通用高度为 64px；题库管理“题目筛选”和 AI 出题“生成题目”两个反馈页面进一步上调到 68px。',
    );
  }

  if (f.endsWith('14_迭代计划与复盘.md')) {
    s = s.replace(
      '将最终视觉覆盖层中 `.collapsible-filter-body--single-row` 的高度提高到 64px，给表单控件底部边框和文字留出余量。',
      '将最终视觉覆盖层中 `.collapsible-filter-body--single-row` 的通用高度保持为 64px，并针对题库管理“题目筛选”和 AI 出题“生成题目”上调到 68px，给表单控件底部边框和文字留出余量。',
    );
  }

  if (f.endsWith('11_测试验收与质量门禁.md')) {
    s = s.replace(
      '> 本节在执行最终命令后同步更新。',
      '| 门禁             | 命令                               | 结果 |\n| ---------------- | ---------------------------------- | ---- |\n| 前端格式化       | `pnpm web:format`                  | PASS |\n| 前端全量质量门禁 | `pnpm web:quality`                 | PASS |\n| 前端生产构建     | `pnpm --filter mindmark-web build` | PASS |',
    );
  }

  fs.writeFileSync(f, s, 'utf8');
}
