from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8-sig')
text=text.replace("import { computed, onMounted, reactive, ref, watch } from 'vue';\n", "import { computed, onMounted, reactive, ref, watch } from 'vue';\n\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
text=text.replace("  listQuestionsPage,\n  updateQuestion,\n  type QuestionUpsertRequest,\n} from '@/services/questionService';", "  deleteQuestion,\n  listQuestionsPage,\n  updateQuestion,\n  type QuestionDeleteResponse,\n  type QuestionUpsertRequest,\n} from '@/services/questionService';")
text=text.replace("  QuestionType,\n} from '@/types/question';", "  QuestionOption,\n  QuestionType,\n  ScoringPoint,\n} from '@/types/question';")
old="""type EditQuestionForm = {
  courseId: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  knowledgePoints: string;
  score: number;
  answer: string;
  analysis: string;
  optionsJson: string;
  scoringPointsJson: string;
};"""
new="""type EditableScoringPoint = ScoringPoint & { keywordsText: string };

type EditQuestionForm = {
  courseId: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  knowledgePoints: string;
  score: number;
  answer: string;
  analysis: string;
  options: QuestionOption[];
  scoringPoints: EditableScoringPoint[];
};"""
text=text.replace(old,new)
text=text.replace("const pageSizeOptions = [10, 20, 50];", "const pageSizeOptions = ['10', '20', '50', '100'];")
text=text.replace("const feedbackMessage = ref<string | null>(null);\nconst feedbackTone = ref<'success' | 'danger' | 'info'>('info');", "const feedbackMessage = ref<string | null>(null);\nconst feedbackTone = ref<'success' | 'danger' | 'info'>('info');\nlet feedbackTimer: number | undefined;")
text=text.replace("const composingSaving = ref(false);\nconst editingQuestion = ref<Question | null>(null);", "const composingSaving = ref(false);\nconst deletingQuestionId = ref<string | null>(null);\nconst editingQuestion = ref<Question | null>(null);")
text=text.replace("  answer: '',\n  analysis: '',\n  optionsJson: '[]',\n  scoringPointsJson: '[]',", "  answer: '',\n  analysis: '',\n  options: [],\n  scoringPoints: [],")
old="""const showFeedback = (message: string, tone: 'success' | 'danger' | 'info' = 'info') => {
  feedbackMessage.value = message;
  feedbackTone.value = tone;
};

const clearFeedback = () => {
  feedbackMessage.value = null;
};"""
new="""const showFeedback = (message: string, tone: 'success' | 'danger' | 'info' = 'info') => {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  feedbackMessage.value = message;
  feedbackTone.value = tone;
  if (tone === 'success') {
    feedbackTimer = window.setTimeout(() => clearFeedback(), 4200);
  }
};

const clearFeedback = () => {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  feedbackMessage.value = null;
};"""
text=text.replace(old,new)
text=text.replace("const setPage = (page: number) => {\n  pagination.page = Math.min(Math.max(page, 1), totalPages.value);\n};\n\n", "")
text=text.replace("const formatJson = (value: unknown) => JSON.stringify(value ?? [], null, 2);\n\n", "")
old="""  editForm.answer = Array.isArray(question.answer) ? question.answer.join(',') : question.answer;
  editForm.analysis = question.analysis;
  editForm.optionsJson = formatJson(question.options);
  editForm.scoringPointsJson = formatJson(question.scoringPoints);"""
new="""  editForm.answer = Array.isArray(question.answer) ? question.answer.join(',') : String(question.answer ?? '');
  editForm.analysis = question.analysis;
  editForm.options = (question.options ?? []).map((option) => ({ ...option }));
  editForm.scoringPoints = (question.scoringPoints ?? []).map((point) => ({
    ...point,
    keywords: [...(point.keywords ?? [])],
    keywordsText: (point.keywords ?? []).join('，'),
  }));"""
text=text.replace(old,new)
old="""const parseJsonArray = <T,>(value: string, label: string): T[] => {
  const parsed = JSON.parse(value || '[]') as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} 必须是 JSON 数组`);
  }

  return parsed as T[];
};

const buildUpdateRequest = (): QuestionUpsertRequest => ({
  courseId: editForm.courseId,
  title: editForm.title.trim(),
  type: editForm.type,
  difficulty: editForm.difficulty,
  knowledgePoints: parseList(editForm.knowledgePoints),
  score: Number(editForm.score) || 0,
  answer: editForm.type === 'MULTIPLE_CHOICE' ? parseList(editForm.answer) : editForm.answer.trim(),
  analysis: editForm.analysis.trim(),
  options: parseJsonArray<QuestionUpsertRequest['options'][number]>(editForm.optionsJson, '选项'),
  scoringPoints: parseJsonArray<QuestionUpsertRequest['scoringPoints'][number]>(
    editForm.scoringPointsJson,
    '评分点',
  ),
});"""
new="""const normalizeOptions = () =>
  editForm.options
    .map((option) => ({ key: option.key.trim(), content: option.content.trim() }))
    .filter((option) => option.key && option.content);

const normalizeScoringPoints = () =>
  editForm.scoringPoints
    .map((point, index) => ({
      id: point.id?.trim() || `SP-${index + 1}`,
      description: point.description.trim(),
      score: Number(point.score) || 0,
      keywords: parseList(point.keywordsText),
      required: Boolean(point.required),
    }))
    .filter((point) => point.description);

const addOption = () => {
  const nextKey = String.fromCharCode(65 + editForm.options.length);
  editForm.options.push({ key: nextKey, content: '' });
};

const removeOption = (index: number) => {
  editForm.options.splice(index, 1);
};

const addScoringPoint = () => {
  editForm.scoringPoints.push({
    id: `SP-${Date.now()}`,
    description: '',
    score: 0,
    keywords: [],
    keywordsText: '',
    required: true,
  });
};

const removeScoringPoint = (index: number) => {
  editForm.scoringPoints.splice(index, 1);
};

const buildUpdateRequest = (): QuestionUpsertRequest => {
  const options = normalizeOptions();
  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(editForm.type) && !options.length) {
    throw new Error('选择/判断题至少需要一个有效选项');
  }

  return {
    courseId: editForm.courseId,
    title: editForm.title.trim(),
    type: editForm.type,
    difficulty: editForm.difficulty,
    knowledgePoints: parseList(editForm.knowledgePoints),
    score: Number(editForm.score) || 0,
    answer: editForm.type === 'MULTIPLE_CHOICE' ? parseList(editForm.answer) : editForm.answer.trim(),
    analysis: editForm.analysis.trim(),
    options,
    scoringPoints: normalizeScoringPoints(),
  };
};"""
text=text.replace(old,new)
marker="const loadPaperOptions = async () => {"
insert="""const describeDeleteResult = (result: QuestionDeleteResponse) =>
  result.message || (result.physicallyDeleted ? '题目已删除。' : '题目已停用并保留历史记录。');

const confirmDeleteQuestion = async (question: Question) => {
  const confirmed = window.confirm(
    `确认删除题目「${question.title}」？\n\n若题目已被试卷引用，系统会自动停用题目并保留历史试卷记录。`,
  );
  if (!confirmed) {
    return;
  }

  deletingQuestionId.value = question.id;
  clearFeedback();
  try {
    const result = await deleteQuestion(question.id);
    showFeedback(describeDeleteResult(result), 'success');
    if (selectedQuestion.value?.id === question.id) {
      selectedQuestion.value = null;
    }
    if (editingQuestion.value?.id === question.id) {
      closeEdit();
    }
    if (composingQuestion.value?.id === question.id) {
      closeCompose();
    }
    await loadQuestions();
  } catch (error) {
    showFeedback(getErrorMessage(error, '删除题目失败，请稍后重试'), 'danger');
  } finally {
    deletingQuestionId.value = null;
  }
};

const handlePaginationChange = (page: number, pageSize: number) => {
  pagination.page = page;
  pagination.pageSize = pageSize;
};

"""
text=text.replace(marker, insert+marker)
old="""watch(
  () => pagination.pageSize,
  () => {
    if (pagination.page !== 1) {
      pagination.page = 1;
      return;
    }
    void loadQuestions();
  },
);

watch(
  () => pagination.page,
  () => {
    void loadQuestions();
  },
);"""
new="""watch(
  () => [pagination.page, pagination.pageSize] as const,
  () => {
    void loadQuestions();
  },
);"""
text=text.replace(old,new)
old="""    <p v-if="feedbackMessage" :class="['question-feedback', `question-feedback--${feedbackTone}`]">
      {{ feedbackMessage }}
    </p>"""
new="""    <div
      v-if="feedbackMessage"
      :class="['question-feedback', `question-feedback--${feedbackTone}`]"
      :role="feedbackTone === 'danger' ? 'alert' : 'status'"
    >
      <span class="question-feedback__icon">
        {{ feedbackTone === 'success' ? '✓' : feedbackTone === 'danger' ? '!' : 'i' }}
      </span>
      <span class="question-feedback__content">{{ feedbackMessage }}</span>
      <button
        class="question-feedback__close"
        type="button"
        aria-label="关闭提示"
        @click="clearFeedback"
      >
        ×
      </button>
    </div>"""
text=text.replace(old,new)
old="""            <span class="action-link" role="button" tabindex="0" @click.stop="openCompose(question)"
              >组卷</span
            >"""
new="""            <span class="action-link" role="button" tabindex="0" @click.stop="openCompose(question)"
              >组卷</span
            >
            <span
              class="action-link action-link--danger"
              role="button"
              tabindex="0"
              @click.stop="confirmDeleteQuestion(question)"
              >{{ deletingQuestionId === question.id ? '删除中' : '删除' }}</span
            >"""
text=text.replace(old,new)
old="""        <div v-if="!loading && !errorMessage && pagination.total > 0" class="question-pagination">
          <span class="muted-text">
            第 {{ pagination.page }} / {{ totalPages }} 页 · 共 {{ pagination.total }} 条
          </span>
          <label class="page-size-field">
            <span>每页</span>
            <select v-model.number="pagination.pageSize" class="select-input">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>
          <div class="inline-actions">
            <button
              class="secondary-button"
              type="button"
              :disabled="pagination.page <= 1"
              @click="setPage(pagination.page - 1)"
            >
              上一页
            </button>
            <button
              class="secondary-button"
              type="button"
              :disabled="pagination.page >= totalPages"
              @click="setPage(pagination.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>"""
new="""        <EnterprisePagination
          v-if="!loading && !errorMessage && pagination.total > 0"
          class="question-pagination"
          :current="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-size-options="pageSizeOptions"
          @change="handlePaginationChange"
        />"""
text=text.replace(old,new)
text=text.replace("支持修订题干、答案、解析与 JSON 结构化选项；驳回的 AI 题保存后会重新进入待审核。", "支持修订题干、答案、解析、选项与评分点；结构化字段使用可视化编辑，避免手写 JSON 造成格式错误。")
old="""        <label class="form-field form-field--full">
          <span>选项 JSON</span>
          <textarea v-model="editForm.optionsJson" class="textarea-input mono-input" rows="4" />
        </label>
        <label class="form-field form-field--full">
          <span>评分点 JSON</span>
          <textarea
            v-model="editForm.scoringPointsJson"
            class="textarea-input mono-input"
            rows="4"
          />
        </label>"""
new="""        <div class="form-field form-field--full structured-editor">
          <div class="structured-editor__header">
            <span>选项</span>
            <button class="secondary-button compact-button" type="button" @click="addOption">
              新增选项
            </button>
          </div>
          <div v-if="!editForm.options.length" class="structured-empty">暂无选项，可按需新增。</div>
          <div v-for="(option, index) in editForm.options" :key="index" class="option-editor-row">
            <input
              v-model.trim="option.key"
              class="text-input option-key-input"
              maxlength="8"
              placeholder="A"
            />
            <input v-model.trim="option.content" class="text-input" placeholder="选项内容" />
            <button
              class="secondary-button compact-button danger-button"
              type="button"
              @click="removeOption(index)"
            >
              删除
            </button>
          </div>
        </div>
        <div class="form-field form-field--full structured-editor">
          <div class="structured-editor__header">
            <span>评分点</span>
            <button class="secondary-button compact-button" type="button" @click="addScoringPoint">
              新增评分点
            </button>
          </div>
          <div v-if="!editForm.scoringPoints.length" class="structured-empty">
            暂无评分点，客观题可不填写。
          </div>
          <div
            v-for="(point, index) in editForm.scoringPoints"
            :key="point.id || index"
            class="scoring-editor-row"
          >
            <input
              v-model.trim="point.description"
              class="text-input"
              placeholder="评分点说明"
            />
            <input
              v-model.number="point.score"
              class="text-input score-input"
              min="0"
              type="number"
              placeholder="分值"
            />
            <input
              v-model.trim="point.keywordsText"
              class="text-input"
              placeholder="关键词，逗号分隔"
            />
            <label class="checkbox-field">
              <input v-model="point.required" type="checkbox" />
              <span>必选</span>
            </label>
            <button
              class="secondary-button compact-button danger-button"
              type="button"
              @click="removeScoringPoint(index)"
            >
              删除
            </button>
          </div>
        </div>"""
text=text.replace(old,new)
old_css=""".question-feedback {
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
}

.question-feedback--success {
  border-color: color-mix(in srgb, var(--mm-color-success) 36%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-success) 8%, var(--mm-color-card));
}

.question-feedback--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}
"""
new_css=""".question-feedback {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  padding: 10px 12px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  color: var(--mm-color-text-primary);
}

.question-feedback__icon {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  background: var(--mm-color-primary-soft);
  color: var(--mm-color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.question-feedback__content {
  min-width: 0;
  line-height: 1.55;
}

.question-feedback__close {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--mm-color-text-secondary);
  cursor: pointer;
}

.question-feedback__close:hover {
  background: var(--mm-color-fill-soft);
  color: var(--mm-color-text-primary);
}

.question-feedback--success {
  border-color: color-mix(in srgb, var(--mm-color-success) 36%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-success) 8%, var(--mm-color-card));
}

.question-feedback--success .question-feedback__icon {
  background: color-mix(in srgb, var(--mm-color-success) 14%, transparent);
  color: var(--mm-color-success);
}

.question-feedback--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.question-feedback--danger .question-feedback__icon {
  background: color-mix(in srgb, var(--mm-color-danger) 14%, transparent);
  color: var(--mm-color-danger);
}
"""
text=text.replace(old_css,new_css)
text=text.replace(""".question-pagination {
  margin-top: var(--space-3);
  padding: var(--space-3) 12px 12px;
  border-top: 1px solid var(--mm-color-border);
}

.page-size-field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--mm-color-text-secondary);
  font-size: 0.84rem;
}

.page-size-field .select-input {
  width: 82px;
}
""", """.question-pagination {
  margin-top: var(--space-3);
  padding: var(--space-3) 12px 12px;
  border-top: 1px solid var(--mm-color-border);
}
""")
insert_css=""".structured-editor {
  display: grid;
  gap: var(--space-2);
}

.structured-editor__header,
.option-editor-row,
.scoring-editor-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.structured-editor__header {
  justify-content: space-between;
}

.structured-editor__header > span {
  color: var(--mm-color-text-primary);
  font-size: 0.82rem;
  font-weight: 650;
}

.structured-empty {
  padding: 10px 12px;
  border: 1px dashed var(--mm-color-border);
  border-radius: var(--radius-sm);
  color: var(--mm-color-text-secondary);
  font-size: 0.82rem;
}

.option-editor-row .text-input,
.scoring-editor-row .text-input {
  min-width: 0;
}

.option-key-input {
  flex: 0 0 68px;
}

.score-input {
  flex: 0 0 88px;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: var(--mm-color-text-secondary);
  font-size: 0.82rem;
}

.compact-button {
  min-height: 30px;
  padding: 0 10px;
}

.danger-button,
.action-link--danger {
  color: var(--mm-color-danger);
}

.danger-button:hover {
  border-color: color-mix(in srgb, var(--mm-color-danger) 42%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

"""
text=text.replace(".mono-input {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;\n}\n\n", insert_css)
text=text.replace("""  .question-pagination,
  .question-table-toolbar,
  .question-panel-actions {
    align-items: flex-start;
    flex-direction: column;
  }""", """  .question-pagination,
  .question-table-toolbar,
  .question-panel-actions,
  .option-editor-row,
  .scoring-editor-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .option-key-input,
  .score-input {
    flex-basis: auto;
    width: 100%;
  }""")
p.write_text(text,encoding='utf-8')
