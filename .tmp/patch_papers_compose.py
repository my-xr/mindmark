from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s = path.read_text(encoding='utf-8')
start = s.index('        <div class="compose-assistant-card">')
end = s.index('        <div class="paper-section-subtitle">', start)
new = '''        <div class="compose-assistant-card compose-assistant-card--refined">
          <div class="compose-assistant-header compose-assistant-header--refined">
            <div class="compose-assistant-title">
              <span class="compose-assistant-icon" aria-hidden="true">🧠</span>
              <div>
                <h3>组卷助手</h3>
                <p class="muted-text">
                  根据当前课程题库，按题型、难度、知识点与目标总分生成结构均衡的 100 分试卷。
                </p>
              </div>
            </div>
            <div class="compose-assistant-status">
              <span
                class="compose-status-pill"
                :class="{ 'compose-status-pill--warning': composeFinalScore !== composeTargetScore }"
              >
                {{ composeFinalScore === composeTargetScore ? '分值已匹配' : '分值需调整' }}
              </span>
              <div class="section-actions">
                <AppActionButton
                  class="icon-action-button"
                  icon="🧩"
                  size="sm"
                  title="恢复 100 分模板"
                  :disabled="operating"
                  @click="resetComposeTemplate"
                >
                  100 分模板
                </AppActionButton>
                <AppActionButton
                  class="icon-action-button"
                  :icon="composePanelOpen ? '▴' : '▾'"
                  size="sm"
                  title="收起或展开组卷规则"
                  @click="composePanelOpen = !composePanelOpen"
                >
                  {{ composePanelOpen ? '收起规则' : '展开规则' }}
                </AppActionButton>
              </div>
            </div>
          </div>

          <div class="compose-step-strip" aria-label="组卷流程">
            <span class="compose-step-strip__item compose-step-strip__item--active">① 配置规则</span>
            <span class="compose-step-strip__item">② 质量预览</span>
            <span class="compose-step-strip__item">③ 写入试卷</span>
          </div>

          <div class="compose-command-panel">
            <div class="compose-toolbar compose-toolbar--refined">
              <label>
                <span>目标总分</span>
                <input v-model.number="composeTargetScore" type="number" min="1" step="0.5" />
              </label>
              <label>
                <span>写入方式</span>
                <select v-model="composeMode">
                  <option value="REPLACE">替换当前试题</option>
                  <option value="APPEND">追加到当前试题</option>
                </select>
              </label>
              <div
                class="compose-score-preview compose-score-preview--refined"
                :class="{ 'compose-score-preview--warning': composeFinalScore !== composeTargetScore }"
              >
                <span>预计总分</span>
                <strong>{{ composeFinalScore }} / {{ composeTargetScore }} 分</strong>
                <small v-if="composeFinalScore !== composeTargetScore">需与目标总分一致后写入</small>
                <small v-else>可进行质量预览或直接组卷</small>
              </div>
            </div>

            <div class="compose-actions-strip">
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
              <AppActionButton
                class="icon-action-button"
                icon="🎲"
                size="sm"
                :loading="operating"
                :disabled="operating || composeFinalScore !== composeTargetScore"
                title="按规则随机抽题"
                @click="composePaper('random')"
              >
                随机组卷
              </AppActionButton>
              <AppActionButton
                class="icon-action-button"
                icon="🤖"
                size="sm"
                variant="primary"
                :loading="operating"
                :disabled="operating || composeFinalScore !== composeTargetScore"
                title="按题库库存智能均衡难度与知识点"
                @click="composePaper('agent')"
              >
                智能组卷
              </AppActionButton>
            </div>
          </div>

          <div v-if="composePreview" class="compose-quality-panel compose-quality-panel--refined">
            <div class="compose-quality-summary">
              <div>
                <span>质量报告</span>
                <strong
                  >{{ composePreview.qualityReport.actualScore }} /
                  {{ composePreview.targetScore }} 分</strong
                >
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

            <div v-if="!composePreview.ready" class="compose-gap-list">
              <strong>库存缺口</strong>
              <span v-for="gap in composePreview.gaps" :key="gap.type">
                {{ gap.message }}：需要 {{ gap.requiredCount }} 道，可用 {{ gap.availableCount }} 道
              </span>
            </div>
            <div v-if="composePreview.warnings.length" class="compose-warning-list">
              <strong>执行说明</strong>
              <span v-for="warning in composePreview.warnings" :key="warning">{{ warning }}</span>
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
              <div class="compose-plan-detail">
                <div v-if="composePreview.agentPlan.rationale.length">
                  <strong>计划依据</strong>
                  <span v-for="item in composePreview.agentPlan.rationale" :key="item">{{
                    item
                  }}</span>
                </div>
                <div v-if="composePreview.agentPlan.recommendations.length">
                  <strong>复核建议</strong>
                  <span v-for="item in composePreview.agentPlan.recommendations" :key="item">{{
                    item
                  }}</span>
                </div>
              </div>
            </div>

            <div v-if="composePreview.qualityReport.risks.length" class="compose-risk-list">
              <strong>需要关注</strong>
              <span v-for="risk in composePreview.qualityReport.risks" :key="risk">{{ risk }}</span>
            </div>
            <div v-else class="compose-highlight-list">
              <strong>质量亮点</strong>
              <span v-for="item in composePreview.qualityReport.highlights" :key="item">{{
                item
              }}</span>
            </div>
          </div>

          <div v-if="composePanelOpen" class="compose-rule-grid compose-rule-grid--refined">
            <article v-for="rule in composeRules" :key="rule.type" class="compose-rule-card">
              <div class="compose-rule-card__header">
                <div class="compose-type-cell">
                  <strong>{{
                    questionTypeOptions.find((item) => item.value === rule.type)?.label
                  }}</strong>
                  <small>{{
                    questionTypeOptions.find((item) => item.value === rule.type)?.scoreHint
                  }}</small>
                </div>
                <strong class="compose-rule-subtotal">
                  {{ Number(rule.count || 0) * Number(rule.score || 0) }} 分
                </strong>
              </div>

              <div class="compose-rule-field-grid">
                <label>
                  <span>题量</span>
                  <input v-model.number="rule.count" type="number" min="0" step="1" />
                </label>
                <label>
                  <span>单题分</span>
                  <input v-model.number="rule.score" type="number" min="0.5" step="0.5" />
                </label>
              </div>

              <label class="compose-rule-knowledge-field">
                <span>知识点约束</span>
                <input v-model="rule.knowledgeText" type="text" placeholder="可选，逗号分隔" />
              </label>

              <div class="compose-difficulty-list" aria-label="难度范围">
                <label v-for="difficulty in difficultyOptions" :key="difficulty.value">
                  <input v-model="rule.difficulties" type="checkbox" :value="difficulty.value" />
                  <span>{{ difficulty.label }}</span>
                </label>
              </div>
            </article>
          </div>
        </div>

'''
path.write_text(s[:start] + new + s[end:], encoding='utf-8')
