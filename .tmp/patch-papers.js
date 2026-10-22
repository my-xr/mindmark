const fs = require('fs');
const path = 'apps/mindmark-web/src/views/teacher/PapersView.vue';
let s = fs.readFileSync(path, 'utf8');
s = s.replace("import { computed, onMounted, reactive, ref } from 'vue';", "import { computed, onMounted, reactive, ref, watch } from 'vue';");
s = s.replace(`const buildComposeRequest = (): PaperComposeRequest => ({
  targetScore: Number(composeTargetScore.value),
  mode: composeMode.value,
  rules: toComposeRules(),
});

const previewComposeQuality`, `const buildComposeRequest = (): PaperComposeRequest => ({
  targetScore: Number(composeTargetScore.value),
  mode: composeMode.value,
  rules: toComposeRules(),
});

watch(
  () => [
    composeTargetScore.value,
    composeMode.value,
    composeRules
      .map(
        (rule) =>
          \`${'${rule.type}'}:${'${rule.count}'}:${'${rule.score}'}:${'${rule.difficulties.join(',')}'}:${'${rule.knowledgeText}'}\`,
      )
      .join('|'),
  ],
  () => {
    composePreview.value = null;
  },
);

const previewComposeQuality`);
s = s.replace(`            <div class="compose-quality-grid">`, `            <div v-if="!composePreview.ready" class="compose-gap-list">
              <strong>库存缺口</strong>
              <span v-for="gap in composePreview.gaps" :key="gap.type">
                {{ gap.message }}：需要 {{ gap.requiredCount }} 道，可用 {{ gap.availableCount }} 道
              </span>
            </div>
            <div v-if="composePreview.warnings.length" class="compose-warning-list">
              <strong>执行说明</strong>
              <span v-for="warning in composePreview.warnings" :key="warning">{{ warning }}</span>
            </div>

            <div class="compose-quality-grid">`);
s = s.replace(`              <ul>
                <li v-for="step in composePreview.agentPlan.steps" :key="step">{{ step }}</li>
              </ul>
            </div>

            <div v-if="composePreview.qualityReport.risks.length" class="compose-risk-list">`, `              <ul>
                <li v-for="step in composePreview.agentPlan.steps" :key="step">{{ step }}</li>
              </ul>
              <div class="compose-plan-detail">
                <div v-if="composePreview.agentPlan.rationale.length">
                  <strong>计划依据</strong>
                  <span v-for="item in composePreview.agentPlan.rationale" :key="item">{{ item }}</span>
                </div>
                <div v-if="composePreview.agentPlan.recommendations.length">
                  <strong>复核建议</strong>
                  <span v-for="item in composePreview.agentPlan.recommendations" :key="item">{{ item }}</span>
                </div>
              </div>
            </div>

            <div v-if="composePreview.qualityReport.risks.length" class="compose-risk-list">`);
fs.writeFileSync(path, s, 'utf8');
