from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s = p.read_text(encoding='utf-8')
old = '''        <button
          v-for="paper in papers"
          :key="paper.id"
          :class="['paper-list-item', { 'paper-list-item--active': paper.id === selectedPaperId }]"
          type="button"
          @click="selectPaper(paper.id)"
        >
          <strong>{{ paper.title }}</strong>
          <span
            >{{ paper.courseName }} · {{ paper.questions.length }} 题 ·
            {{ paper.totalScore }} 分</span
          >
          <StatusTag
            :label="PAPER_STATUS_META[paper.status].label"
            :tone="PAPER_STATUS_META[paper.status].tone"
          />
        </button>
'''
new = '''        <div class="paper-list-grid">
          <button
            v-for="paper in papers"
            :key="paper.id"
            :class="['paper-list-item', { 'paper-list-item--active': paper.id === selectedPaperId }]"
            type="button"
            @click="selectPaper(paper.id)"
          >
            <span class="paper-list-item__topline">
              <strong>{{ paper.title }}</strong>
              <StatusTag
                :label="PAPER_STATUS_META[paper.status].label"
                :tone="PAPER_STATUS_META[paper.status].tone"
              />
            </span>
            <span class="paper-list-item__meta">
              {{ paper.courseName }} · {{ paper.questions.length }} 题 · {{ paper.totalScore }} 分
            </span>
          </button>
        </div>
'''
if old not in s:
    raise SystemExit('paper list block not found')
s = s.replace(old, new)
old2 = '''          <div v-if="composePanelOpen" class="compose-rule-table">
            <div class="compose-rule-row compose-rule-row--head">
              <span>题型</span>
              <span>题量</span>
              <span>单题分</span>
              <span>难度范围</span>
              <span>知识点约束</span>
              <span>小计</span>
            </div>
            <div v-for="rule in composeRules" :key="rule.type" class="compose-rule-row">
              <div class="compose-type-cell">
                <strong>{{
                  questionTypeOptions.find((item) => item.value === rule.type)?.label
                }}</strong>
                <small>{{
                  questionTypeOptions.find((item) => item.value === rule.type)?.scoreHint
                }}</small>
              </div>
              <input v-model.number="rule.count" type="number" min="0" step="1" />
              <input v-model.number="rule.score" type="number" min="0.5" step="0.5" />
              <div class="compose-difficulty-list">
                <label v-for="difficulty in difficultyOptions" :key="difficulty.value">
                  <input v-model="rule.difficulties" type="checkbox" :value="difficulty.value" />
                  <span>{{ difficulty.label }}</span>
                </label>
              </div>
              <input v-model="rule.knowledgeText" type="text" placeholder="可选，逗号分隔" />
              <strong>{{ Number(rule.count || 0) * Number(rule.score || 0) }} 分</strong>
            </div>
          </div>
'''
new2 = '''          <div v-if="composePanelOpen" class="compose-rule-grid">
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
'''
if old2 not in s:
    raise SystemExit('compose rule block not found')
s = s.replace(old2, new2)
old3 = '''        <div class="paper-question-list">
          <article v-for="item in paperQuestions" :key="item.id" class="paper-question-item">
'''
new3 = '''        <div class="paper-section-subtitle">
          <div>
            <h3>当前试卷题目</h3>
            <span>{{ paperQuestionPagination.total }} 道题，按题号顺序展示</span>
          </div>
        </div>

        <div class="paper-question-list">
          <article v-for="item in paperQuestions" :key="item.id" class="paper-question-item">
'''
if old3 not in s:
    raise SystemExit('paper question list marker not found')
s = s.replace(old3, new3)
old4 = '''        <template v-else>
          <article
            v-for="question in availableQuestions"
            :key="question.id"
            class="question-pool-item"
          >
'''
new4 = '''        <template v-else>
          <div class="question-pool-list">
            <article
              v-for="question in availableQuestions"
              :key="question.id"
              class="question-pool-item"
            >
'''
if old4 not in s:
    raise SystemExit('question pool start not found')
s = s.replace(old4, new4)
old5 = '''          </article>
          <EnterprisePagination
            v-if="availableQuestionPagination.total > 0"
'''
# replace only last occurrence after question-pool-item by rfind before pagination
idx = s.rfind(old5)
if idx == -1:
    raise SystemExit('question pool end not found')
s = s[:idx] + '''            </article>
          </div>
          <EnterprisePagination
            v-if="availableQuestionPagination.total > 0"
''' + s[idx+len(old5):]
p.write_text(s, encoding='utf-8')