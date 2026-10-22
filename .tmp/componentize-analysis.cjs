const fs = require('fs');
const path = 'apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue';
let s = fs.readFileSync(path, 'utf8');
if (!s.includes("import PageSection from '@/components/common/PageSection.vue';")) {
  s = s.replace("import StatusTag from '@/components/common/StatusTag.vue';\n", "import PageSection from '@/components/common/PageSection.vue';\nimport StatusTag from '@/components/common/StatusTag.vue';\n");
}
const analysisHeaderOld = `<section class="content-card review-analysis-card">
    <div class="section-title">
      <div>
        <h2>成绩分布与薄弱点</h2>
        <p class="muted-text">用于判断课堂讲评重点和分层作业方向。</p>
      </div>
      <div class="lecture-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'REVIEW_REPORT_MARKDOWN')"
        >
          {{ exportingType === 'REVIEW_REPORT_MARKDOWN' ? '导出中...' : '导出复盘报告' }}
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'SCORE_SUMMARY_CSV')"
        >
          {{ exportingType === 'SCORE_SUMMARY_CSV' ? '导出中...' : '导出成绩 CSV' }}
        </button>
      </div>
    </div>`;
const analysisHeaderNew = `<PageSection
    class="review-analysis-card"
    title="成绩分布与薄弱点"
    description="用于判断课堂讲评重点和分层作业方向。"
  >
    <template #actions>
      <div class="lecture-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'REVIEW_REPORT_MARKDOWN')"
        >
          {{ exportingType === 'REVIEW_REPORT_MARKDOWN' ? '导出中...' : '导出复盘报告' }}
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'SCORE_SUMMARY_CSV')"
        >
          {{ exportingType === 'SCORE_SUMMARY_CSV' ? '导出中...' : '导出成绩 CSV' }}
        </button>
      </div>
    </template>`;
if (!s.includes(analysisHeaderNew)) {
  if (!s.includes(analysisHeaderOld)) throw new Error('analysis header not found');
  s = s.replace(analysisHeaderOld, analysisHeaderNew);
}
const closeAnalysisOld = `    </div>
  </section>

  <section class="content-card review-question-card">`;
const closeAnalysisNew = `    </div>
  </PageSection>

  <PageSection
    class="review-question-card"
    title="题目表现"
    description="低得分率题目应优先进入讲评。"
  >`;
if (!s.includes(closeAnalysisNew)) {
  if (!s.includes(closeAnalysisOld)) throw new Error('analysis close/question open not found');
  s = s.replace(closeAnalysisOld, closeAnalysisNew);
}
const questionHeaderOld = `
    <div class="section-title">
      <div>
        <h2>题目表现</h2>
        <p class="muted-text">低得分率题目应优先进入讲评。</p>
      </div>
    </div>`;
if (s.includes(questionHeaderOld)) {
  s = s.replace(questionHeaderOld, '');
}
const questionCloseOld = `    </div>
  </section>
</template>`;
const questionCloseNew = `    </div>
  </PageSection>
</template>`;
if (!s.includes(questionCloseNew)) {
  if (!s.includes(questionCloseOld)) throw new Error('question close not found');
  s = s.replace(questionCloseOld, questionCloseNew);
}
fs.writeFileSync(path, s, 'utf8');
