from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("""  selectedExamId.value = summaries.value.some((summary) => summary.examId === selectedExamId.value)
    ? selectedExamId.value
    : summaries.value[0]?.examId || '';""", """  selectedExamId.value = summaries.value.some((summary) => summary.examId === selectedExamId.value)
    ? selectedExamId.value
    : '';""")
s=s.replace("""    await loadSummaries();
    await loadReports();""", """    await loadSummaries();
    if (selectedExamId.value) {
      await loadReports();
    } else {
      reports.value = [];
      reportTotal.value = 0;
    }""", 1)
s=s.replace("""  await loadSummaries();
  reportPagination.page = 1;
  await loadReports();""", """  selectedExamId.value = '';
  reports.value = [];
  reportTotal.value = 0;
  reportPagination.page = 1;
  await loadSummaries();""")
insert="""
const backToScoreBatchList = () => {
  selectedExamId.value = '';
  reports.value = [];
  reportTotal.value = 0;
  reportPagination.page = 1;
  operationMessage.value = '';
};
"""
s=s.replace("const scoreBandClass = (band: ScoreBandSummary) => ({\n", insert+"\nconst scoreBandClass = (band: ScoreBandSummary) => ({\n")
s=s.replace('<main v-else class="score-layout">\n      <aside class="content-card score-exam-list">', '<main\n      v-else\n      :class="[\'score-layout\', selectedSummary ? \'score-layout--detail\' : \'score-layout--list\']"\n    >\n      <section v-if="!selectedSummary" class="content-card score-exam-list score-exam-list--full">')
s=s.replace('      </aside>\n\n      <section v-if="selectedSummary" class="content-card score-detail-card">', '      </section>\n\n      <section v-if="selectedSummary" class="content-card score-detail-card score-detail-card--full">')
s=s.replace('''        <button
          v-for="summary in pagedSummaries"
          :key="summary.examId"
          :class="[
            'score-exam-button',
            { 'score-exam-button--active': summary.examId === selectedExamId },
          ]"
          type="button"
          @click="selectExam(summary.examId)"
        >
          <span>
            <strong>{{ summary.examTitle }}</strong>
            <small
              >{{ summary.courseName }} · {{ summary.reviewedCount }}/{{
                summary.submittedCount
              }}
              已复核</small
            >
          </span>
          <StatusTag
            :label="SCORE_PUBLISH_STATUS_META[summary.publishStatus].label"
            :tone="SCORE_PUBLISH_STATUS_META[summary.publishStatus].tone"
          />
        </button>''', '''        <div class="score-exam-grid">
          <button
            v-for="summary in pagedSummaries"
            :key="summary.examId"
            class="score-exam-button"
            type="button"
            @click="selectExam(summary.examId)"
          >
            <span class="score-exam-button__main">
              <span class="score-exam-button__topline">
                <strong :title="summary.examTitle">{{ summary.examTitle }}</strong>
                <StatusTag
                  :label="SCORE_PUBLISH_STATUS_META[summary.publishStatus].label"
                  :tone="SCORE_PUBLISH_STATUS_META[summary.publishStatus].tone"
                />
              </span>
              <small :title="summary.courseName">{{ summary.courseName }}</small>
            </span>
            <span class="score-exam-button__stats">
              <span>提交 {{ summary.submittedCount }}/{{ summary.participantCount }}</span>
              <span>复核 {{ summary.reviewedCount }} 份</span>
              <span>均分 {{ summary.averageScore }}</span>
              <span>及格率 {{ summary.passRate }}%</span>
            </span>
          </button>
        </div>''')
s=s.replace('''          <AppActionButton
            class="icon-action-button"
            icon="📣"''', '''          <div class="section-actions score-detail-actions">
            <AppActionButton
              class="icon-action-button"
              icon="←"
              title="返回考试成绩批次"
              @click="backToScoreBatchList"
            >
              返回批次
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📣"''')
s=s.replace('''            @click="publishScores"
          >
            {{
              publishing
                ? '发布中...'
                : selectedSummary.publishStatus === 'PUBLISHED'
                  ? '已发布'
                  : '发布成绩'
            }}
          </AppActionButton>''', '''              @click="publishScores"
            >
              {{
                publishing
                  ? '发布中...'
                  : selectedSummary.publishStatus === 'PUBLISHED'
                    ? '已发布'
                    : '发布成绩'
              }}
            </AppActionButton>
          </div>''')
p.write_text(s,encoding='utf-8',newline='\n')
