from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
text=p.read_text(encoding='utf-8-sig')
text=text.replace("import { computed, onMounted, ref } from 'vue';", "import { computed, onMounted, reactive, ref } from 'vue';")
text=text.replace("import { useClientPagination } from '@/composables/useClientPagination';\n", "")
text=text.replace("  listExamScoreSummaries,\n  listScoreReportsByExam,\n", "  listExamScoreSummariesPage,\n  listScoreReportsByExamPage,\n")
old='''const operationMessage = ref('');\nconst {\n  pagination: summaryPagination,\n  items: pagedSummaries,\n  resetPage: resetSummaryPage,\n  clampPage: clampSummaryPage,\n  handleChange: handleSummaryPaginationChangeBase,\n} = useClientPagination(() => summaries.value, 8);\nconst {\n  pagination: reportPagination,\n  items: pagedReports,\n  resetPage: resetReportPage,\n  clampPage: clampReportPage,\n  handleChange: handleReportPaginationChange,\n} = useClientPagination(() => reports.value, 10);\n'''
new='''const operationMessage = ref('');\nconst summaryTotal = ref(0);\nconst reportTotal = ref(0);\nconst summaryPagination = reactive({ page: 1, pageSize: 8 });\nconst reportPagination = reactive({ page: 1, pageSize: 10 });\nconst pagedSummaries = computed(() => summaries.value);\nconst pagedReports = computed(() => reports.value);\n'''
if old not in text:
    raise SystemExit('pagination block not found')
text=text.replace(old,new)
old_load_reports='''const loadReports = async () => {\n  if (!selectedExamId.value) {\n    reports.value = [];\n    return;\n  }\n\n  reportsLoading.value = true;\n  try {\n    reports.value = await listScoreReportsByExam(selectedExamId.value);\n    clampReportPage();\n  } finally {\n    reportsLoading.value = false;\n  }\n};\n'''
new_load_reports='''const loadReports = async () => {\n  if (!selectedExamId.value) {\n    reports.value = [];\n    reportTotal.value = 0;\n    return;\n  }\n\n  reportsLoading.value = true;\n  try {\n    const response = await listScoreReportsByExamPage(selectedExamId.value, {\n      page: reportPagination.page,\n      pageSize: reportPagination.pageSize,\n    });\n    reports.value = response.items;\n    reportTotal.value = response.total;\n    reportPagination.page = response.page;\n    reportPagination.pageSize = response.pageSize;\n  } finally {\n    reportsLoading.value = false;\n  }\n};\n\nconst loadSummaries = async () => {\n  const response = await listExamScoreSummariesPage({\n    page: summaryPagination.page,\n    pageSize: summaryPagination.pageSize,\n  });\n  summaries.value = response.items;\n  summaryTotal.value = response.total;\n  summaryPagination.page = response.page;\n  summaryPagination.pageSize = response.pageSize;\n  selectedExamId.value = summaries.value.some((summary) => summary.examId === selectedExamId.value)\n    ? selectedExamId.value\n    : summaries.value[0]?.examId || '';\n};\n'''
if old_load_reports not in text:
    raise SystemExit('load reports not found')
text=text.replace(old_load_reports,new_load_reports)
text=text.replace('''    summaries.value = await listExamScoreSummaries();\n    selectedExamId.value = selectedExamId.value || summaries.value[0]?.examId || '';\n    clampSummaryPage();\n    await loadReports();''', '''    await loadSummaries();\n    await loadReports();''')
text=text.replace('''    resetSummaryPage();\n    resetReportPage();\n''', '''    summaryPagination.page = 1;\n    reportPagination.page = 1;\n    summaryTotal.value = 0;\n    reportTotal.value = 0;\n''')
text=text.replace('''  resetReportPage();\n  await loadReports();''', '''  reportPagination.page = 1;\n  await loadReports();''')
old_func='''const handleSummaryPaginationChange = async (page: number, pageSize: number) => {\n  handleSummaryPaginationChangeBase(page, pageSize);\n\n  const start = (summaryPagination.page - 1) * summaryPagination.pageSize;\n  const firstSummary = summaries.value.slice(start, start + summaryPagination.pageSize)[0];\n\n  if (firstSummary && firstSummary.examId !== selectedExamId.value) {\n    selectedExamId.value = firstSummary.examId;\n    operationMessage.value = '';\n    resetReportPage();\n    await loadReports();\n  }\n};\n'''
new_func='''const handleSummaryPaginationChange = async (page: number, pageSize: number) => {\n  summaryPagination.page = page;\n  summaryPagination.pageSize = pageSize;\n  operationMessage.value = '';\n  await loadSummaries();\n  reportPagination.page = 1;\n  await loadReports();\n};\n\nconst handleReportPaginationChange = async (page: number, pageSize: number) => {\n  reportPagination.page = page;\n  reportPagination.pageSize = pageSize;\n  await loadReports();\n};\n'''
if old_func not in text:
    raise SystemExit('summary handler not found')
text=text.replace(old_func,new_func)
text=text.replace('''    summaries.value = await publishExamScores(selectedExamId.value);\n    await loadReports();''', '''    await publishExamScores(selectedExamId.value);\n    await loadSummaries();\n    await loadReports();''')
text=text.replace(':total="summaries.length"', ':total="summaryTotal"')
text=text.replace(':total="reports.length"', ':total="reportTotal"')
text=text.replace('v-if="summaries.length > summaryPagination.pageSize"', 'v-if="summaryTotal > summaryPagination.pageSize"')
text=text.replace('v-if="reports.length > reportPagination.pageSize"', 'v-if="reportTotal > reportPagination.pageSize"')
p.write_text(text,encoding='utf-8')
