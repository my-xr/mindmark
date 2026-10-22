const fs = require('fs');
const path = 'apps/mindmark-web/src/views/teacher/ReviewsView.vue';
let s = fs.readFileSync(path, 'utf8');
s = s.replace("import PageHeader from '@/components/common/PageHeader.vue';\n", "import PageHeader from '@/components/common/PageHeader.vue';\nimport SummaryStrip from '@/components/common/SummaryStrip.vue';\n");
const oldBlock = `<section class="content-card review-current-card">
          <div class="review-current-main">
            <span class="eyebrow-text">当前复盘</span>
            <h2>{{ selectedReport.examTitle }}</h2>
            <p>
              {{ selectedReport.courseName }} · {{ selectedReport.reviewedCount }}/{{
                selectedReport.submittedCount
              }}
              已批改
            </p>
          </div>
          <div class="review-current-stats">
            <span
              >产物 <strong>{{ selectedReport.artifacts?.length ?? 0 }}</strong></span
            >
            <span
              >风险标签 <strong>{{ selectedReport.lectureDraft.riskLabels.length }}</strong></span
            >
            <span
              >题目表现 <strong>{{ selectedReport.questionPerformances.length }}</strong></span
            >
          </div>
        </section>`;
const newBlock = `<SummaryStrip
          class="content-card review-current-card"
          eyebrow="当前复盘"
          :title="selectedReport.examTitle"
          :description="\`${'${selectedReport.courseName}'} · ${'${selectedReport.reviewedCount}'}/${'${selectedReport.submittedCount}'} 已批改\`"
          :stats="[
            { label: '产物', value: selectedReport.artifacts?.length ?? 0 },
            { label: '风险标签', value: selectedReport.lectureDraft.riskLabels.length },
            { label: '题目表现', value: selectedReport.questionPerformances.length },
          ]"
        />`;
if (!s.includes(oldBlock)) throw new Error('ReviewsView block not found');
s = s.replace(oldBlock, newBlock);
fs.writeFileSync(path, s, 'utf8');
