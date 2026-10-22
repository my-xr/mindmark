const fs=require('fs');
const f='apps/mindmark-web/src/views/teacher/ReviewsView.vue';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`<div class="review-current-stats">
            <span>平均分 <strong>{{ selectedReport.averageScore }}</strong></span>
            <span>及格率 <strong>{{ selectedReport.passRate }}%</strong></span>
            <span>薄弱点 <strong>{{ weakKnowledgeCount }}</strong></span>
          </div>`, `<div class="review-current-stats">
            <span>产物 <strong>{{ selectedReport.artifacts?.length ?? 0 }}</strong></span>
            <span>风险标签 <strong>{{ selectedReport.lectureDraft.riskLabels.length }}</strong></span>
            <span>题目表现 <strong>{{ selectedReport.questionPerformances.length }}</strong></span>
          </div>`);
fs.writeFileSync(f,s,'utf8');
