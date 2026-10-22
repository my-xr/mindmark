from pathlib import Path
p = Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('      <section v-if="!canEdit" class="content-card operation-notice operation-notice--warning">\n        <StatusTag label="当前不可答题" tone="warning" />\n        <p class="muted-text">\n          当前考试状态为 {{ exam.status }}，仅在进行中且全屏答题时可继续作答。\n        </p>\n      </section>\n', '      <section v-if="!baseCanEdit" class="content-card operation-notice operation-notice--warning">\n        <StatusTag label="当前不可答题" tone="warning" />\n        <p class="muted-text">\n          当前考试状态为 {{ exam.status }}，仅在考试进行中可继续作答。\n        </p>\n      </section>\n')
p.write_text(s, encoding='utf-8')
