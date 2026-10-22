from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/GradingView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("import AppActionButton from '@/components/common/AppActionButton.vue';\n", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport AppFormControl from '@/components/common/AppFormControl.vue';\n")
s=s.replace("const selectedTask = computed(\n  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? tasks.value[0] ?? null,\n);", "const selectedTask = computed(\n  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,\n);")
s=s.replace("const examOptions = computed(() =>\n  exams.value.filter(\n    (exam) => !selectedCourseName.value || exam.courseName === selectedCourseName.value,\n  ),\n);", "const examOptions = computed(() =>\n  exams.value.filter(\n    (exam) => !selectedCourseName.value || exam.courseName === selectedCourseName.value,\n  ),\n);\nconst courseFilterOptions = computed(() => [\n  { label: '全部科目', value: '' },\n  ...courseOptions.value.map((courseName) => ({ label: courseName, value: courseName })),\n]);\nconst examFilterOptions = computed(() => [\n  { label: '全部考试', value: '' },\n  ...examOptions.value.map((exam) => ({ label: exam.title, value: exam.id })),\n]);\nconst scoreBandFilterOptions = computed(() => [\n  { label: '全部分数段', value: '' },\n  ...scoreBandOptions,\n]);")
s=s.replace("});const pendingCount = computed(\n", "});\nconst pendingCount = computed(\n")
s=s.replace("    selectedTaskId.value = tasks.value.some((task) => task.id === selectedTaskId.value)\n      ? selectedTaskId.value\n      : tasks.value[0]?.id || '';\n    await loadQuestionGrades();\n    await loadLatestAiJob(true);", "    selectedTaskId.value = tasks.value.some((task) => task.id === selectedTaskId.value)\n      ? selectedTaskId.value\n      : '';\n    if (selectedTaskId.value) {\n      await loadQuestionGrades();\n      await loadLatestAiJob(true);\n    } else {\n      questionGrades.value = [];\n      questionTotal.value = 0;\n      currentAiJob.value = null;\n      clearAiJobPolling();\n    }")
insert = """
const backToTaskList = () => {
  selectedTaskId.value = '';
  questionPagination.page = 1;
  questionGrades.value = [];
  questionTotal.value = 0;
  scoreOverrides.value = {};
  operationMessage.value = '';
  currentAiJob.value = null;
  clearAiJobPolling();
};
"""
s=s.replace("const resetTaskSelectionForFilter = () => {\n", insert+"\nconst resetTaskSelectionForFilter = () => {\n")
s=s.replace('<main v-else class="grading-layout">\n      <aside class="content-card grading-task-list">', '<main\n      v-else\n      :class="[\n        \'grading-layout\',\n        selectedTask ? \'grading-layout--detail\' : \'grading-layout--list\',\n      ]"\n    >\n      <section v-if="!selectedTask" class="content-card grading-task-list grading-task-list--full">')
s=s.replace('      </aside>\n\n      <section v-if="selectedTask" class="content-card grading-detail-card">', '      </section>\n\n      <section v-if="selectedTask" class="content-card grading-detail-card grading-detail-card--full">')
s=s.replace('''          <label class="form-field compact-field">
            <span>科目</span>
            <select
              v-model="selectedCourseName"
              class="text-input"
              :disabled="loading || examOptionsLoading"
              @change="handleCourseFilterChange"
            >
              <option value="">全部科目</option>
              <option v-for="courseName in courseOptions" :key="courseName" :value="courseName">
                {{ courseName }}
              </option>
            </select>
          </label>
          <label class="form-field compact-field">
            <span>考试</span>
            <select
              v-model="selectedExamId"
              class="text-input"
              :disabled="loading || examOptionsLoading"
              @change="handleExamFilterChange"
            >
              <option value="">全部考试</option>
              <option v-for="exam in examOptions" :key="exam.id" :value="exam.id">
                {{ exam.title }}
              </option>
            </select>
          </label>

          <label class="form-field compact-field">
            <span>分数段</span>
            <select
              v-model="selectedScoreBand"
              class="text-input"
              :disabled="loading"
              @change="handleScoreBandFilterChange"
            >
              <option value="">全部分数段</option>
              <option v-for="band in scoreBandOptions" :key="band.value" :value="band.value">
                {{ band.label }}
              </option>
            </select>
          </label>''', '''          <AppFormControl
            v-model="selectedCourseName"
            control="select"
            label="科目"
            :options="courseFilterOptions"
            :disabled="loading || examOptionsLoading"
            @change="handleCourseFilterChange"
          />
          <AppFormControl
            v-model="selectedExamId"
            control="select"
            label="考试"
            :options="examFilterOptions"
            :disabled="loading || examOptionsLoading"
            @change="handleExamFilterChange"
          />

          <AppFormControl
            v-model="selectedScoreBand"
            control="select"
            label="分数段"
            :options="scoreBandFilterOptions"
            :disabled="loading"
            @change="handleScoreBandFilterChange"
          />''')
s=s.replace('''        <button
          v-for="task in pagedTasks"
          :key="task.id"
          :class="[
            'grading-task-button',
            { 'grading-task-button--active': task.id === selectedTask?.id },
          ]"
          type="button"
          @click="selectTask(task.id)"
        >
          <span class="grading-task-main">
            <strong class="grading-task-student" :title="task.studentName">
              {{ task.studentName }}
            </strong>
            <small
              class="grading-task-meta"
              :title="`${task.examTitle} · ${task.className} · ${task.submittedAt}`"
            >
              <span class="grading-task-exam">{{ task.examTitle }}</span>
              <span class="grading-task-meta-line">
                <span class="grading-task-class">{{ task.className }}</span>
                <time>{{ task.submittedAt }}</time>
              </span>
            </small>
          </span>
          <span class="grading-task-side">
            <span v-if="task.failed" class="soft-tag soft-tag--danger">不及格复核</span>
            <span v-else-if="task.needsReview" class="soft-tag soft-tag--warning">建议抽查</span>
            <StatusTag
              class="grading-task-status"
              :label="GRADING_TASK_STATUS_META[task.status].label"
              :tone="GRADING_TASK_STATUS_META[task.status].tone"
            />
          </span>
        </button>''', '''        <div v-else class="grading-task-grid">
          <button
            v-for="task in pagedTasks"
            :key="task.id"
            :class="[
              'grading-task-button',
              { 'grading-task-button--active': task.id === selectedTask?.id },
            ]"
            type="button"
            @click="selectTask(task.id)"
          >
            <span class="grading-task-main">
              <span class="grading-task-topline">
                <strong class="grading-task-student" :title="task.studentName">
                  {{ task.studentName }}
                </strong>
                <StatusTag
                  class="grading-task-status"
                  :label="GRADING_TASK_STATUS_META[task.status].label"
                  :tone="GRADING_TASK_STATUS_META[task.status].tone"
                />
              </span>
              <small
                class="grading-task-meta"
                :title="`${task.examTitle} · ${task.className} · ${task.submittedAt}`"
              >
                <span class="grading-task-exam">{{ task.examTitle }}</span>
                <span class="grading-task-meta-line">
                  <span class="grading-task-class">{{ task.className }}</span>
                  <time>{{ task.submittedAt }}</time>
                </span>
              </small>
            </span>
            <span class="grading-task-side">
              <span class="grading-task-score">
                {{ task.currentScore }}/{{ task.totalScore }} 分
              </span>
              <span v-if="task.failed" class="soft-tag soft-tag--danger">不及格复核</span>
              <span v-else-if="task.needsReview" class="soft-tag soft-tag--warning">建议抽查</span>
              <span v-else class="soft-tag soft-tag--success">系统分可核对</span>
            </span>
          </button>
        </div>''')
s=s.replace('''          <div class="section-actions grading-detail-actions">
            <AppActionButton''', '''          <div class="section-actions grading-detail-actions">
            <AppActionButton
              class="icon-action-button"
              icon="←"
              size="sm"
              title="返回答卷队列"
              @click="backToTaskList"
            >
              返回队列
            </AppActionButton>
            <AppActionButton''')
p.write_text(s, encoding='utf-8')
