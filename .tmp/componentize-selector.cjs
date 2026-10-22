const fs = require('fs');
const path = 'apps/mindmark-web/src/components/review/ReviewReportSelector.vue';
let s = fs.readFileSync(path, 'utf8');
s = s.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import EmptyState from '@/components/common/EmptyState.vue';\nimport PageSection from '@/components/common/PageSection.vue';\n");
s = s.replace(/<div class="content-card review-selector-card">\s*<div class="section-title">\s*<div>\s*<h2>考试列表<\/h2>\s*<p class="muted-text">选择已提交或已批改的考试进行复盘。<\/p>\s*<\/div>\s*<\/div>/, '<PageSection\n      class="review-selector-card"\n      title="考试列表"\n      description="选择已提交或已批改的考试进行复盘。"\n    >');
s = s.replace(/\n    <\/div>\n  <\/aside>/, '\n    </PageSection>\n  </aside>');
fs.writeFileSync(path, s, 'utf8');
