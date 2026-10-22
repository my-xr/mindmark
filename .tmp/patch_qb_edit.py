from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
start=text.index('        <div class="question-edit-grid">')
end=text.index('        <div class="question-drawer-actions">', start)
new='''        <div class="question-edit-sections">
          <section class="question-edit-section">
            <div class="question-edit-section__head">
              <strong>基础属性</strong>
              <span>决定题目归属、类型、难度和默认分值。</span>
            </div>
            <div class="question-edit-grid question-edit-grid--meta">
              <label class="form-field">
                <span>课程</span>
                <select v-model="editForm.courseId" class="select-input">
                  <option disabled value="">请选择课程</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }}
                  </option>
                </select>
              </label>
              <label class="form-field">
                <span>题型</span>
                <select v-model="editForm.type" class="select-input">
                  <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="form-field">
                <span>难度</span>
                <select v-model="editForm.difficulty" class="select-input">
                  <option
                    v-for="option in difficultyOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="form-field">
                <span>分值</span>
                <input v-model.number="editForm.score" class="text-input" min="0" type="number" />
              </label>
            </div>
          </section>

          <section class="question-edit-section">
            <div class="question-edit-section__head">
              <strong>题目内容</strong>
              <span>题干、知识点、参考答案和解析均以结构化字段保存。</span>
            </div>
            <div class="question-edit-grid">
              <label class="form-field form-field--full">
                <span>题干</span>
                <textarea
                  v-model.trim="editForm.title"
                  class="text-input textarea-input question-title-textarea"
                  rows="5"
                  placeholder="请输入清晰、完整、无歧义的题干"
                />
              </label>
              <label class="form-field form-field--full">
                <span>知识点</span>
                <input
                  v-model.trim="editForm.knowledgePoints"
                  class="text-input"
                  placeholder="多个知识点可用中文逗号、英文逗号或换行分隔"
                />
              </label>
              <label class="form-field form-field--full">
                <span>参考答案</span>
                <textarea
                  v-model.trim="editForm.answer"
                  class="text-input textarea-input"
                  rows="2"
                  placeholder="多选题可填写 A,B 或用逗号分隔"
                />
              </label>
              <label class="form-field form-field--full">
                <span>解析</span>
                <textarea
                  v-model.trim="editForm.analysis"
                  class="text-input textarea-input"
                  rows="4"
                  placeholder="请说明答案依据，便于学生订正和 AI 讲评复用"
                />
              </label>
            </div>
          </section>

          <section class="question-edit-section structured-editor">
            <div class="structured-editor__header">
              <div class="question-edit-section__head">
                <strong>选项</strong>
                <span>客观题建议保持 2-6 个选项，主观题可留空。</span>
              </div>
              <button class="secondary-button compact-button" type="button" @click="addOption">
                ＋ 新增选项
              </button>
            </div>
            <div v-if="!editForm.options.length" class="structured-empty">
              暂无选项，主观题可不填写。
            </div>
            <div
              v-for="(option, index) in editForm.options"
              :key="`${option.key}-${index}`"
              class="option-editor-row"
            >
              <input v-model.trim="option.key" class="text-input option-key-input" placeholder="A" />
              <input v-model.trim="option.content" class="text-input" placeholder="选项内容" />
              <button
                class="secondary-button compact-button danger-button"
                type="button"
                @click="removeOption(index)"
              >
                删除
              </button>
            </div>
          </section>

          <section class="question-edit-section structured-editor">
            <div class="structured-editor__header">
              <div class="question-edit-section__head">
                <strong>评分点</strong>
                <span>主观题可配置关键词和必需项，客观题可留空。</span>
              </div>
              <button class="secondary-button compact-button" type="button" @click="addScoringPoint">
                ＋ 新增评分点
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
              <input v-model.trim="point.description" class="text-input" placeholder="评分点说明" />
              <input
                v-model.number="point.score"
                class="text-input score-input"
                min="0"
                type="number"
                placeholder="分值"
              />
              <input v-model.trim="point.keywordsText" class="text-input" placeholder="关键词，逗号分隔" />
              <label class="checkbox-field">
                <input v-model="point.required" type="checkbox" />
                <span>必需</span>
              </label>
              <button
                class="secondary-button compact-button danger-button"
                type="button"
                @click="removeScoringPoint(index)"
              >
                删除
              </button>
            </div>
          </section>
        </div>

'''
text=text[:start]+new+text[end:]
p.write_text(text, encoding='utf-8')
