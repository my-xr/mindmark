const fs=require('fs');
const path='apps/mindmark-web/src/views/teacher/PapersView.vue';
let text=fs.readFileSync(path,'utf8');
if(!text.includes('@click="previewComposeQuality')){
text=text.replace(`            <div class="section-actions compose-actions">
              <AppActionButton`, `            <div class="section-actions compose-actions">
              <AppActionButton
                class="icon-action-button"
                icon="📊"
                size="sm"
                :loading="composePreviewLoading"
                :disabled="operating || composePreviewLoading || composeFinalScore !== composeTargetScore"
                title="预览题型、难度、知识点覆盖质量"
                @click="previewComposeQuality('agent')"
              >
                质量预览
              </AppActionButton>
              <AppActionButton`);
}
if(!text.includes('compose-quality-panel')){
text=text.replace(`          <div v-if="composePanelOpen" class="compose-rule-table">
`, `          <div v-if="composePreview" class="compose-quality-panel">
            <div class="compose-quality-summary">
              <div>
                <span>质量报告</span>
                <strong>{{ composePreview.qualityReport.actualScore }} / {{ composePreview.targetScore }} 分</strong>
              </div>
              <div>
                <span>计划新增</span>
                <strong>{{ composePreview.plannedAddedCount }} 道</strong>
              </div>
              <div>
                <span>知识点</span>
                <strong>{{ composePreview.qualityReport.knowledgePointCount }} 个</strong>
              </div>
              <div>
                <span>工作流</span>
                <strong>{{ composePreview.strategy === 'AGENT' ? '智能计划' : '随机计划' }}</strong>
              </div>
            </div>

            <div class="compose-quality-grid">
              <div class="compose-quality-card">
                <h4>题型分值</h4>
                <div
                  v-for="item in composePreview.qualityReport.typeDistribution"
                  :key="item.key"
                  class="compose-bar-row"
                >
                  <span>{{ item.label }}</span>
                  <div><i :style="{ width: item.percentage + '%' }"></i></div>
                  <strong>{{ item.count }}题 / {{ item.score }}分</strong>
                </div>
              </div>
              <div class="compose-quality-card">
                <h4>难度结构</h4>
                <div
                  v-for="item in composePreview.qualityReport.difficultyDistribution"
                  :key="item.key"
                  class="compose-bar-row"
                >
                  <span>{{ item.label }}</span>
                  <div><i :style="{ width: item.percentage + '%' }"></i></div>
                  <strong>{{ item.percentage }}%</strong>
                </div>
              </div>
              <div class="compose-quality-card compose-quality-card--wide">
                <h4>知识点覆盖</h4>
                <div class="compose-knowledge-tags">
                  <span
                    v-for="item in composePreview.qualityReport.knowledgePointDistribution"
                    :key="item.key"
                  >
                    {{ item.label }} · {{ item.count }}题
                  </span>
                </div>
              </div>
            </div>

            <div class="compose-agent-plan">
              <div>
                <h4>{{ composePreview.agentPlan.summary }}</h4>
                <p class="muted-text">{{ composePreview.agentPlan.workflow }}</p>
              </div>
              <ul>
                <li v-for="step in composePreview.agentPlan.steps" :key="step">{{ step }}</li>
              </ul>
            </div>

            <div v-if="composePreview.qualityReport.risks.length" class="compose-risk-list">
              <strong>需要关注</strong>
              <span v-for="risk in composePreview.qualityReport.risks" :key="risk">{{ risk }}</span>
            </div>
            <div v-else class="compose-highlight-list">
              <strong>质量亮点</strong>
              <span v-for="item in composePreview.qualityReport.highlights" :key="item">{{ item }}</span>
            </div>
          </div>

          <div v-if="composePanelOpen" class="compose-rule-table">
`);
}
fs.writeFileSync(path,text,'utf8');
