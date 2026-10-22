from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/GradingView.vue')
text = p.read_text(encoding='utf-8-sig')
text = text.replace("import { computed, onMounted, ref } from 'vue';", "import { computed, onMounted, ref, watch } from 'vue';")
text = text.replace("import type { GradingScoreOverride, GradingTask } from '@/types/grading';", "import type { GradingScoreOverride, GradingTask, QuestionGrade } from '@/types/grading';")
anchor = "const selectedTask = computed(\n  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? tasks.value[0] ?? null,\n);\nconst pendingCount"
insert = "const selectedTask = computed(\n  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? tasks.value[0] ?? null,\n);\nconst selectedQuestionGrades = computed<QuestionGrade[]>(() => selectedTask.value?.questionGrades ?? []);\nconst {\n  pagination: questionPagination,\n  items: pagedQuestionGrades,\n  resetPage: resetQuestionPage,\n  clampPage: clampQuestionPage,\n  handleChange: handleQuestionPaginationChange,\n} = useClientPagination(() => selectedQuestionGrades.value, 10);\nconst pendingCount"
if anchor not in text:
    raise SystemExit('anchor selectedTask not found')
text = text.replace(anchor, insert)
text = text.replace("    selectedTaskId.value = selectedTaskId.value || tasks.value[0]?.id || '';\n    clampTaskPage();", "    selectedTaskId.value = selectedTaskId.value || tasks.value[0]?.id || '';\n    clampTaskPage();\n    clampQuestionPage();")
text = text.replace("      tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));\n      operationMessage.value", "      tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));\n      clampQuestionPage();\n      operationMessage.value")
anchor2 = "onMounted(() => {\n  void loadTasks();\n});"
insert2 = "watch(selectedTaskId, () => {\n  resetQuestionPage();\n});\n\nonMounted(() => {\n  void loadTasks();\n});"
if anchor2 not in text:
    raise SystemExit('anchor onMounted not found')
text = text.replace(anchor2, insert2)
text = text.replace('v-for="grade in selectedTask.questionGrades"', 'v-for="grade in pagedQuestionGrades"')
marker = "          </article>\n        </div>\n      </section>"
pag = '''          </article>\n          <EnterprisePagination\n            v-if="selectedQuestionGrades.length > questionPagination.pageSize"\n            class="section-pagination"\n            :current="questionPagination.page"\n            :page-size="questionPagination.pageSize"\n            :total="selectedQuestionGrades.length"\n            :page-size-options="['10', '20', '50']"\n            :disabled="reviewing"\n            @change="handleQuestionPaginationChange"\n          />\n        </div>\n      </section>'''
if marker not in text:
    raise SystemExit('marker article list not found')
text = text.replace(marker, pag, 1)
p.write_text(text, encoding='utf-8')
