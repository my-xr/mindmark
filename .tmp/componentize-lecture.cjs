const fs = require('fs');
const path = 'apps/mindmark-web/src/components/review/LectureDraftCard.vue';
let s = fs.readFileSync(path, 'utf8');
if (!s.includes("import PageSection from '@/components/common/PageSection.vue';")) {
  s = s.replace("import StatusTag from '@/components/common/StatusTag.vue';\n", "import PageSection from '@/components/common/PageSection.vue';\nimport StatusTag from '@/components/common/StatusTag.vue';\n");
}
const headerOld = `<section class="content-card lecture-draft-card">
    <div class="section-title">
      <div>
        <h2>AI 讲评稿</h2>
        <p class="muted-text">AI 内容仅供教师参考，确认前必须人工核对数据、措辞和教学建议。</p>
      </div>
      <div class="lecture-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="generating"
          @click="emit('regenerate')"
        >
          {{ generating ? '生成中...' : '重新生成讲评稿' }}
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '导出中...' : '导出讲评稿' }}
        </button>
        <button class="primary-button" type="button" :disabled="approving" @click="emit('approve')">
          {{ approving ? '确认中...' : '确认讲评稿' }}
        </button>
      </div>
    </div>`;
const headerNew = `<PageSection
    class="lecture-draft-card"
    title="AI 讲评稿"
    description="AI 内容仅供教师参考，确认前必须人工核对数据、措辞和教学建议。"
  >
    <template #actions>
      <div class="lecture-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="generating"
          @click="emit('regenerate')"
        >
          {{ generating ? '生成中...' : '重新生成讲评稿' }}
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '导出中...' : '导出讲评稿' }}
        </button>
        <button class="primary-button" type="button" :disabled="approving" @click="emit('approve')">
          {{ approving ? '确认中...' : '确认讲评稿' }}
        </button>
      </div>
    </template>`;
if (!s.includes(headerNew)) {
  if (!s.includes(headerOld)) throw new Error('lecture header not found');
  s = s.replace(headerOld, headerNew);
}
s = s.replace(/\n  <\/section>\n<\/template>$/, '\n  </PageSection>\n</template>');
fs.writeFileSync(path, s, 'utf8');
