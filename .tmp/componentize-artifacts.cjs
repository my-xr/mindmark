const fs = require('fs');
const path = 'apps/mindmark-web/src/components/review/ReviewArtifactList.vue';
let s = fs.readFileSync(path, 'utf8');
s = s.replace("import type { ReviewArtifact, ReviewArtifactType } from '@/types/review';\n", "import PageSection from '@/components/common/PageSection.vue';\nimport type { ReviewArtifact, ReviewArtifactType } from '@/types/review';\n");
s = s.replace(/<section v-if="artifacts.length" class="content-card review-artifact-card">\s*<div class="section-title">\s*<div>\s*<h2>已生成产物<\/h2>\s*<p class="muted-text">导出文件已上传到对象存储，可下载留档。<\/p>\s*<\/div>\s*<\/div>/, '<PageSection\n    v-if="artifacts.length"\n    class="review-artifact-card"\n    title="已生成产物"\n    description="导出文件已上传到对象存储，可下载留档。"\n  >');
s = s.replace(/\n  <\/section>\n<\/template>/, '\n  </PageSection>\n</template>');
fs.writeFileSync(path, s, 'utf8');
