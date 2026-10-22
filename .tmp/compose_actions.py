from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
old = '''          <div class="question-drawer-actions">
            <RouterLink class="secondary-button" to="/teacher/papers">前往试卷与组卷</RouterLink>
            <button
              class="primary-button"
              type="button"
              :disabled="composingSaving || !selectedPaperId"
              @click="confirmCompose"
            >
              {{ composingSaving ? '加入中...' : '确认加入' }}
            </button>
          </div>'''
new = '''          <div class="question-drawer-actions question-editor-actions question-compose-actions">
            <RouterLink
              class="secondary-button question-editor-action question-editor-action--cancel question-compose-action"
              to="/teacher/papers"
            >
              <span class="question-editor-action__icon">↗</span>
              <span>试卷管理</span>
            </RouterLink>
            <button
              class="primary-button question-editor-action question-editor-action--save question-compose-action"
              type="button"
              :disabled="composingSaving || !selectedPaperId"
              @click="confirmCompose"
            >
              <span class="question-editor-action__icon">{{ composingSaving ? '⏳' : '＋' }}</span>
              <span>{{ composingSaving ? '加入中...' : '确认加入' }}</span>
            </button>
          </div>'''
if old not in text:
    raise SystemExit('compose actions block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
