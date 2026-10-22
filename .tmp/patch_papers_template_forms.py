from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8')
old = '''              <label>
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
'''
new = '''              <AppFormControl
                v-model="composeTargetScore"
                label="目标总分"
                type="number"
                min="1"
                step="0.5"
              />
              <AppFormControl
                v-model="composeMode"
                control="select"
                label="写入方式"
                :options="composeModeOptions"
              />
'''
if old not in s: raise SystemExit('toolbar block not found')
s=s.replace(old,new,1)
old2 = '''              <div class="compose-rule-field-grid">
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
'''
new2 = '''              <div class="compose-rule-field-grid">
                <AppFormControl v-model="rule.count" label="题量" type="number" min="0" step="1" />
                <AppFormControl
                  v-model="rule.score"
                  label="单题分"
                  type="number"
                  min="0.5"
                  step="0.5"
                />
              </div>

              <AppFormControl
                v-model="rule.knowledgeText"
                class="compose-rule-knowledge-field"
                label="知识点约束"
                placeholder="可选，逗号分隔"
              />

              <AppChoiceChips
                class="compose-difficulty-list"
                label="难度范围"
                :model-value="rule.difficulties"
                :options="difficultyOptions"
                @update:model-value="updateRuleDifficulties(rule, $event)"
              />
'''
if old2 not in s: raise SystemExit('rule block not found')
s=s.replace(old2,new2,1)
p.write_text(s, encoding='utf-8')
