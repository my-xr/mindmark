from pathlib import Path

root = Path('D:/vc/MindMark')

# Create composable
p = root / 'apps/mindmark-web/src/composables/useClientPagination.ts'
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("""import { computed, reactive, watch } from 'vue';

export interface ClientPaginationState {
  page: number;
  pageSize: number;
}

export const useClientPagination = <T>(source: () => readonly T[], initialPageSize = 10) => {
  const pagination = reactive<ClientPaginationState>({
    page: 1,
    pageSize: initialPageSize,
  });

  const total = computed(() => source().length);
  const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

  const items = computed(() => {
    const safePage = Math.min(Math.max(1, pagination.page), maxPage.value);
    const start = (safePage - 1) * pagination.pageSize;

    return source().slice(start, start + pagination.pageSize);
  });

  const clampPage = () => {
    pagination.page = Math.min(Math.max(1, pagination.page), maxPage.value);
  };

  const resetPage = () => {
    pagination.page = 1;
  };

  const handleChange = (page: number, pageSize: number) => {
    pagination.page = page;
    pagination.pageSize = pageSize;
    clampPage();
  };

  watch([total, () => pagination.pageSize], clampPage, { flush: 'sync' });

  return {
    pagination,
    total,
    items,
    resetPage,
    clampPage,
    handleChange,
  };
};
""", encoding='utf-8', newline='\n')

# AiQuestionsView
p = root / 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import { DIFFICULTY_META, QUESTION_TYPE_META } from '@/constants/question';\n", "import { DIFFICULTY_META, QUESTION_TYPE_META } from '@/constants/question';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("const reviewingId = ref<string | null>(null);\nconst isGenerateCollapsed = ref(false);\nconst draftStatus = ref<AiQuestionDraftFilterStatus>('PENDING_REVIEW');\n", "const reviewingId = ref<string | null>(null);\nconst isGenerateCollapsed = ref(false);\nconst draftStatus = ref<AiQuestionDraftFilterStatus>('PENDING_REVIEW');\nconst {\n  pagination: draftPagination,\n  items: pagedDrafts,\n  resetPage: resetDraftPage,\n  clampPage: clampDraftPage,\n  handleChange: handleDraftPaginationChange,\n} = useClientPagination(() => drafts.value, 5);\n")
s = s.replace("    drafts.value = await listAiQuestionDrafts(draftStatus.value);\n", "    drafts.value = await listAiQuestionDrafts(draftStatus.value);\n    clampDraftPage();\n")
s = s.replace("    await loadDrafts();\n    await loadTaskHistory();\n", "    resetDraftPage();\n    await loadDrafts();\n    await loadTaskHistory();\n", 1)
s = s.replace("watch(draftStatus, () => {\n  void loadDrafts();\n});\n", "watch(draftStatus, () => {\n  resetDraftPage();\n  void loadDrafts();\n});\n")
s = s.replace("      <article v-for=\"draft in drafts\" v-else :key=\"draft.id\" class=\"ai-draft-item\">", "      <article v-for=\"draft in pagedDrafts\" v-else :key=\"draft.id\" class=\"ai-draft-item\">")
s = s.replace("        </div>\n      </article>\n    </section>\n", "        </div>\n      </article>\n      <EnterprisePagination\n        v-if=\"!isLoading && drafts.length > draftPagination.pageSize\"\n        class=\"section-pagination ai-draft-pagination\"\n        :current=\"draftPagination.page\"\n        :page-size=\"draftPagination.pageSize\"\n        :total=\"drafts.length\"\n        :page-size-options=\"['5', '10', '20']\"\n        :disabled=\"isLoading\"\n        @change=\"handleDraftPaginationChange\"\n      />\n    </section>\n", 1)
s = s.replace(".task-history-pagination {\n  margin-top: var(--space-3);\n}\n", ".task-history-pagination,\n.ai-draft-pagination {\n  margin-top: var(--space-3);\n}\n")
p.write_text(s, encoding='utf-8', newline='\n')

# PapersView
p = root / 'apps/mindmark-web/src/views/teacher/PapersView.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import { computed, onMounted, ref } from 'vue';", "import { computed, onMounted, ref, watch } from 'vue';")
s = s.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import EmptyState from '@/components/common/EmptyState.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
s = s.replace("import { PAPER_STATUS_META } from '@/constants/status';\n", "import { PAPER_STATUS_META } from '@/constants/status';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("const availableQuestions = computed(() => {\n", "const selectedPaperQuestions = computed(() => selectedPaper.value?.questions ?? []);\n\nconst availableQuestions = computed(() => {\n")
s = s.replace("});\n\nconst loadData = async () => {\n", "});\n\nconst {\n  pagination: paperPagination,\n  items: pagedPapers,\n  clampPage: clampPaperPage,\n  handleChange: handlePaperPaginationChange,\n} = useClientPagination(() => papers.value, 6);\nconst {\n  pagination: paperQuestionPagination,\n  items: pagedPaperQuestions,\n  resetPage: resetPaperQuestionPage,\n  clampPage: clampPaperQuestionPage,\n  handleChange: handlePaperQuestionPaginationChange,\n} = useClientPagination(() => selectedPaperQuestions.value, 5);\nconst {\n  pagination: availableQuestionPagination,\n  items: pagedAvailableQuestions,\n  resetPage: resetAvailableQuestionPage,\n  clampPage: clampAvailableQuestionPage,\n  handleChange: handleAvailableQuestionPaginationChange,\n} = useClientPagination(() => availableQuestions.value, 5);\n\nwatch(selectedPaperId, () => {\n  resetPaperQuestionPage();\n  resetAvailableQuestionPage();\n});\n\nconst loadData = async () => {\n", 1)
s = s.replace("    selectedPaperId.value = selectedPaperId.value || paperResult[0]?.id || '';\n", "    selectedPaperId.value = selectedPaperId.value || paperResult[0]?.id || '';\n    clampPaperPage();\n    clampPaperQuestionPage();\n    clampAvailableQuestionPage();\n")
s = s.replace("  selectedPaperId.value =\n    nextPapers.find((paper) => paper.id === selectedPaperId.value)?.id ?? nextPapers[0]?.id ?? '';\n};\n", "  selectedPaperId.value =\n    nextPapers.find((paper) => paper.id === selectedPaperId.value)?.id ?? nextPapers[0]?.id ?? '';\n  clampPaperPage();\n  clampPaperQuestionPage();\n  clampAvailableQuestionPage();\n};\n")
s = s.replace("          v-for=\"paper in papers\"", "          v-for=\"paper in pagedPapers\"")
s = s.replace("        </button>\n      </section>\n", "        </button>\n        <EnterprisePagination\n          v-if=\"papers.length > paperPagination.pageSize\"\n          class=\"section-pagination\"\n          :current=\"paperPagination.page\"\n          :page-size=\"paperPagination.pageSize\"\n          :total=\"papers.length\"\n          :page-size-options=\"['6', '12', '24']\"\n          :disabled=\"loading\"\n          @change=\"handlePaperPaginationChange\"\n        />\n      </section>\n", 1)
s = s.replace("            v-for=\"item in selectedPaper.questions\"", "            v-for=\"item in pagedPaperQuestions\"")
s = s.replace("          </article>\n        </div>\n      </section>\n", "          </article>\n        </div>\n        <EnterprisePagination\n          v-if=\"selectedPaperQuestions.length > paperQuestionPagination.pageSize\"\n          class=\"section-pagination\"\n          :current=\"paperQuestionPagination.page\"\n          :page-size=\"paperQuestionPagination.pageSize\"\n          :total=\"selectedPaperQuestions.length\"\n          :page-size-options=\"['5', '10', '20']\"\n          :disabled=\"operating\"\n          @change=\"handlePaperQuestionPaginationChange\"\n        />\n      </section>\n", 1)
s = s.replace("        <article\n          v-for=\"question in availableQuestions\"\n          v-else\n          :key=\"question.id\"\n          class=\"question-pool-item\"\n        >", "        <template v-else>\n          <article\n            v-for=\"question in pagedAvailableQuestions\"\n            :key=\"question.id\"\n            class=\"question-pool-item\"\n          >")
s = s.replace("          </AppActionButton\n        </article>\n      </section>\n", "            </AppActionButton>\n          </article>\n          <EnterprisePagination\n            v-if=\"availableQuestions.length > availableQuestionPagination.pageSize\"\n            class=\"section-pagination\"\n            :current=\"availableQuestionPagination.page\"\n            :page-size=\"availableQuestionPagination.pageSize\"\n            :total=\"availableQuestions.length\"\n            :page-size-options=\"['5', '10', '20', '50']\"\n            :disabled=\"operating\"\n            @change=\"handleAvailableQuestionPaginationChange\"\n          />\n        </template>\n      </section>\n", 1)
p.write_text(s, encoding='utf-8', newline='\n')

# ExamsView
p = root / 'apps/mindmark-web/src/views/teacher/ExamsView.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import AppActionButton from '@/components/common/AppActionButton.vue';\n", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
s = s.replace("import { EXAM_STATUS_META, PAPER_STATUS_META } from '@/constants/status';\n", "import { EXAM_STATUS_META, PAPER_STATUS_META } from '@/constants/status';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("const canCreate = computed(() => !validationMessage.value);\n", "const canCreate = computed(() => !validationMessage.value);\nconst {\n  pagination: examPagination,\n  items: pagedExams,\n  resetPage: resetExamPage,\n  clampPage: clampExamPage,\n  handleChange: handleExamPaginationChange,\n} = useClientPagination(() => exams.value, 6);\n")
s = s.replace("    form.classIds = form.classIds.length\n      ? form.classIds\n      : classResult[0]?.id\n        ? [classResult[0].id]\n        : [];\n", "    form.classIds = form.classIds.length\n      ? form.classIds\n      : classResult[0]?.id\n        ? [classResult[0].id]\n        : [];\n    clampExamPage();\n")
s = s.replace("    exams.value = await createExam(request);\n", "    exams.value = await createExam(request);\n    resetExamPage();\n")
s = s.replace("        <article v-for=\"exam in exams\" :key=\"exam.id\" class=\"exam-card-item\">", "        <article v-for=\"exam in pagedExams\" :key=\"exam.id\" class=\"exam-card-item\">")
s = s.replace("        </article>\n      </div>\n    </section>\n", "        </article>\n        <EnterprisePagination\n          v-if=\"exams.length > examPagination.pageSize\"\n          class=\"section-pagination\"\n          :current=\"examPagination.page\"\n          :page-size=\"examPagination.pageSize\"\n          :total=\"exams.length\"\n          :page-size-options=\"['6', '12', '24']\"\n          :disabled=\"loading\"\n          @change=\"handleExamPaginationChange\"\n        />\n      </div>\n    </section>\n", 1)
p.write_text(s, encoding='utf-8', newline='\n')

# ReviewsView
p = root / 'apps/mindmark-web/src/views/teacher/ReviewsView.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import EmptyState from '@/components/common/EmptyState.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
s = s.replace("import ReviewReportSelector from '@/components/review/ReviewReportSelector.vue';\n", "import ReviewReportSelector from '@/components/review/ReviewReportSelector.vue';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("const securityError = ref('');\nlet generationPollTimer: number | undefined;\n", "const securityError = ref('');\nconst {\n  pagination: securityEventPagination,\n  items: pagedSecurityEvents,\n  resetPage: resetSecurityEventPage,\n  clampPage: clampSecurityEventPage,\n  handleChange: handleSecurityEventPaginationChange,\n} = useClientPagination(() => securityEvents.value, 10);\nlet generationPollTimer: number | undefined;\n")
s = s.replace("    securityEvents.value = [];\n    securityError.value = '';\n", "    securityEvents.value = [];\n    securityError.value = '';\n    resetSecurityEventPage();\n", 1)
s = s.replace("    securityEvents.value = await listExamSecurityEvents(examId);\n", "    securityEvents.value = await listExamSecurityEvents(examId);\n    clampSecurityEventPage();\n")
s = s.replace("    securityEvents.value = [];\n    securityError.value = error instanceof Error ? error.message : '考试安全审计加载失败';\n", "    securityEvents.value = [];\n    securityError.value = error instanceof Error ? error.message : '考试安全审计加载失败';\n    resetSecurityEventPage();\n")
s = s.replace("              v-for=\"event in securityEvents\"", "              v-for=\"event in pagedSecurityEvents\"")
s = s.replace("            </article>\n          </div>\n        </section>\n", "            </article>\n            <EnterprisePagination\n              v-if=\"securityEvents.length > securityEventPagination.pageSize\"\n              class=\"section-pagination\"\n              :current=\"securityEventPagination.page\"\n              :page-size=\"securityEventPagination.pageSize\"\n              :total=\"securityEvents.length\"\n              :page-size-options=\"['10', '20', '50']\"\n              :disabled=\"securityLoading\"\n              @change=\"handleSecurityEventPaginationChange\"\n            />\n          </div>\n        </section>\n", 1)
p.write_text(s, encoding='utf-8', newline='\n')

# ReviewReportSelector
p = root / 'apps/mindmark-web/src/components/review/ReviewReportSelector.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import EmptyState from '@/components/common/EmptyState.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
s = s.replace("import PageSection from '@/components/common/PageSection.vue';\n", "import PageSection from '@/components/common/PageSection.vue';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("defineProps<{\n  reports: ExamReviewReport[];\n  selectedExamId: string;\n  loading: boolean;\n}>();\n", "const props = defineProps<{\n  reports: ExamReviewReport[];\n  selectedExamId: string;\n  loading: boolean;\n}>();\n\nconst {\n  pagination: reportPagination,\n  items: pagedReports,\n  handleChange: handleReportPaginationChange,\n} = useClientPagination(() => props.reports, 8);\n")
s = s.replace("        v-for=\"report in reports\"", "        v-for=\"report in pagedReports\"")
s = s.replace("      </button>\n    </PageSection>\n", "      </button>\n      <EnterprisePagination\n        v-if=\"reports.length > reportPagination.pageSize\"\n        class=\"section-pagination\"\n        :current=\"reportPagination.page\"\n        :page-size=\"reportPagination.pageSize\"\n        :total=\"reports.length\"\n        :page-size-options=\"['8', '16', '32']\"\n        :disabled=\"loading\"\n        @change=\"handleReportPaginationChange\"\n      />\n    </PageSection>\n", 1)
p.write_text(s, encoding='utf-8', newline='\n')

# GradingView
p = root / 'apps/mindmark-web/src/views/teacher/GradingView.vue'
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import EmptyState from '@/components/common/EmptyState.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\n")
s = s.replace("import { GRADING_TASK_STATUS_META } from '@/constants/status';\n", "import { GRADING_TASK_STATUS_META } from '@/constants/status';\nimport { useClientPagination } from '@/composables/useClientPagination';\n")
s = s.replace("const operationMessage = ref('');\n\nconst selectedTask = computed(\n", "const operationMessage = ref('');\nconst {\n  pagination: taskPagination,\n  items: pagedTasks,\n  clampPage: clampTaskPage,\n  handleChange: handleTaskPaginationChange,\n} = useClientPagination(() => tasks.value, 8);\n\nconst selectedTask = computed(\n")
s = s.replace("    tasks.value = await listGradingTasks();\n    selectedTaskId.value = selectedTaskId.value || tasks.value[0]?.id || '';\n", "    tasks.value = await listGradingTasks();\n    selectedTaskId.value = selectedTaskId.value || tasks.value[0]?.id || '';\n    clampTaskPage();\n")
s = s.replace("          v-for=\"task in tasks\"", "          v-for=\"task in pagedTasks\"")
s = s.replace("        </button>\n      </aside>\n", "        </button>\n        <EnterprisePagination\n          v-if=\"tasks.length > taskPagination.pageSize\"\n          class=\"section-pagination\"\n          :current=\"taskPagination.page\"\n          :page-size=\"taskPagination.pageSize\"\n          :total=\"tasks.length\"\n          :page-size-options=\"['8', '16', '32']\"\n          :disabled=\"loading\"\n          @change=\"handleTaskPaginationChange\"\n        />\n      </aside>\n", 1)
p.write_text(s, encoding='utf-8', newline='\n')

# Global CSS section pagination
p = root / 'apps/mindmark-web/src/styles/components.css'
s = p.read_text(encoding='utf-8-sig')
if '.section-pagination' not in s:
    insert = """
.section-pagination {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--mm-color-border-subtle);
}

"""
    marker = ".exam-card-list,\n"
    idx = s.find(marker)
    if idx != -1:
        s = s[:idx] + insert + s[idx:]
    else:
        s += insert
p.write_text(s, encoding='utf-8', newline='\n')
