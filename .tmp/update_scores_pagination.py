from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
text = p.read_text(encoding='utf-8-sig')
text = text.replace("import { computed, onMounted, ref } from 'vue';", "import { computed, onMounted, ref } from 'vue';")
text = text.replace("import AppActionButton from '@/components/common/AppActionButton.vue';\nimport EmptyState", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport EmptyState")
# add imports
text = text.replace("import EmptyState from '@/components/common/EmptyState.vue';\nimport ErrorState", "import EmptyState from '@/components/common/EmptyState.vue';\nimport EnterprisePagination from '@/components/common/EnterprisePagination.vue';\nimport ErrorState")
text = text.replace("import { SCORE_PUBLISH_STATUS_META } from '@/constants/status';", "import { SCORE_PUBLISH_STATUS_META } from '@/constants/status';\nimport { useClientPagination } from '@/composables/useClientPagination';")
anchor = "const operationMessage = ref('');\n\nconst selectedSummary"
insert = "const operationMessage = ref('');\nconst {\n  pagination: summaryPagination,\n  items: pagedSummaries,\n  resetPage: resetSummaryPage,\n  clampPage: clampSummaryPage,\n  handleChange: handleSummaryPaginationChangeBase,\n} = useClientPagination(() => summaries.value, 8);\nconst {\n  pagination: reportPagination,\n  items: pagedReports,\n  resetPage: resetReportPage,\n  clampPage: clampReportPage,\n  handleChange: handleReportPaginationChange,\n} = useClientPagination(() => reports.value, 10);\n\nconst selectedSummary"
if anchor not in text:
    raise SystemExit('anchor1 not found')
text = text.replace(anchor, insert)
# update loadReports reset not here maybe after reports set clamp
text = text.replace("    reports.value = await listScoreReportsByExam(selectedExamId.value);\n", "    reports.value = await listScoreReportsByExam(selectedExamId.value);\n    clampReportPage();\n")
text = text.replace("    selectedExamId.value = selectedExamId.value || summaries.value[0]?.examId || '';\n    await loadReports();", "    selectedExamId.value = selectedExamId.value || summaries.value[0]?.examId || '';\n    clampSummaryPage();\n    await loadReports();")
text = text.replace("  selectedExamId.value = '';\n    errorMessage.value", "  selectedExamId.value = '';\n    resetSummaryPage();\n    resetReportPage();\n    errorMessage.value")
text = text.replace("  selectedExamId.value = examId;\n  operationMessage.value = '';\n  await loadReports();", "  selectedExamId.value = examId;\n  operationMessage.value = '';\n  resetReportPage();\n  await loadReports();")
# add summary change function before publishScores
anchor2 = "const publishScores = async () => {"
func = "const handleSummaryPaginationChange = async (page: number, pageSize: number) => {\n  handleSummaryPaginationChangeBase(page, pageSize);\n\n  const start = (summaryPagination.page - 1) * summaryPagination.pageSize;\n  const firstSummary = summaries.value.slice(start, start + summaryPagination.pageSize)[0];\n\n  if (firstSummary && firstSummary.examId !== selectedExamId.value) {\n    selectedExamId.value = firstSummary.examId;\n    operationMessage.value = '';\n    resetReportPage();\n    await loadReports();\n  }\n};\n\nconst publishScores = async () => {"
if anchor2 not in text:
    raise SystemExit('anchor2 not found')
text = text.replace(anchor2, func)
# Use pagedSummaries and pagination
text = text.replace('v-for="summary in summaries"', 'v-for="summary in pagedSummaries"')
insert_pag = '''        <EnterprisePagination\n          v-if="summaries.length > summaryPagination.pageSize"\n          class="section-pagination"\n          :current="summaryPagination.page"\n          :page-size="summaryPagination.pageSize"\n          :total="summaries.length"\n          :page-size-options="['8', '16', '32']"\n          :disabled="loading || reportsLoading || publishing"\n          @change="handleSummaryPaginationChange"\n        />\n'''
marker = "        </button>\n      </aside>"
if marker not in text:
    raise SystemExit('marker button aside not found')
text = text.replace(marker, "        </button>\n" + insert_pag + "      </aside>", 1)
# report v-for and pagination after table
text = text.replace('v-for="report in reports"', 'v-for="report in pagedReports"')
marker2 = "          </div>\n        </div>\n      </section>"
insert_report_pag = '''          </div>\n        </div>\n        <EnterprisePagination\n          v-if="reports.length > reportPagination.pageSize"\n          class="section-pagination"\n          :current="reportPagination.page"\n          :page-size="reportPagination.pageSize"\n          :total="reports.length"\n          :page-size-options="['10', '20', '50', '100']"\n          :disabled="reportsLoading || publishing"\n          @change="handleReportPaginationChange"\n        />\n      </section>'''
if marker2 not in text:
    raise SystemExit('marker report not found')
text = text.replace(marker2, insert_report_pag, 1)
p.write_text(text, encoding='utf-8')
