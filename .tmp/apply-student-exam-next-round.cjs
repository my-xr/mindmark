const fs = require('fs');
const path = require('path');
const root = process.cwd();

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content, { encoding: 'utf8' });
}
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

write('apps/mindmark-web/src/utils/examTime.ts', `export type ExamTimingPhase = 'BEFORE_START' | 'IN_WINDOW' | 'ENDED' | 'UNKNOWN';

export interface ExamTimingInfo {
  phase: ExamTimingPhase;
  countdownText: string;
  helperText: string;
  startMs: number;
  endMs: number;
}

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.replace(' ', 'T');
  const withSeconds = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized;

  return /(?:Z|[+-]\\d{2}:?\\d{2})$/.test(withSeconds) ? withSeconds : `${withSeconds}+08:00`;
};

export const parseExamDateTime = (value?: string | null) => {
  if (!value) {
    return Number.NaN;
  }

  const timestamp = Date.parse(normalizeDateInput(value));

  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
};

export const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const getExamTimingInfo = (startAt?: string | null, endAt?: string | null, nowMs = Date.now()): ExamTimingInfo => {
  const startMs = parseExamDateTime(startAt);
  const endMs = parseExamDateTime(endAt);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return {
      phase: 'UNKNOWN',
      countdownText: '',
      helperText: '考试时间待确认',
      startMs,
      endMs,
    };
  }

  if (nowMs < startMs) {
    const countdownText = formatCountdown(startMs - nowMs);

    return {
      phase: 'BEFORE_START',
      countdownText,
      helperText: `距离考试开始还有 ${countdownText}`,
      startMs,
      endMs,
    };
  }

  if (nowMs <= endMs) {
    const countdownText = formatCountdown(endMs - nowMs);

    return {
      phase: 'IN_WINDOW',
      countdownText,
      helperText: `考试进行中，距离结束还有 ${countdownText}`,
      startMs,
      endMs,
    };
  }

  return {
    phase: 'ENDED',
    countdownText: '',
    helperText: '考试时间已结束',
    startMs,
    endMs,
  };
};
`);

let types = read('apps/mindmark-web/src/types/exam.ts');
types = types.replace(`  startTime: string;\n  endTime: string;`, `  startAt?: string;\n  endAt?: string;\n  startTime: string;\n  endTime: string;`);
types = types.replace(`  timeRange: string;\n  durationMinutes: number;`, `  timeRange: string;\n  startAt: string;\n  endAt: string;\n  startTime: string;\n  endTime: string;\n  durationMinutes: number;`);
write('apps/mindmark-web/src/types/exam.ts', types);

let service = read('apps/mindmark-web/src/services/examService.ts');
service = service.replace(`    startTime: normalizeDateTime(response.startAt),\n    endTime: normalizeDateTime(response.endAt),`, `    startAt: response.startAt,\n    endAt: response.endAt,\n    startTime: normalizeDateTime(response.startAt),\n    endTime: normalizeDateTime(response.endAt),`);
service = service.replace(`      timeRange: `${normalizeDateTime(response.startAt)} - ${normalizeDateTime(response.endAt)}`,\n      durationMinutes: response.durationMinutes,`, `      timeRange: `${normalizeDateTime(response.startAt)} - ${normalizeDateTime(response.endAt)}`,\n      startAt: response.startAt,\n      endAt: response.endAt,\n      startTime: normalizeDateTime(response.startAt),\n      endTime: normalizeDateTime(response.endAt),\n      durationMinutes: response.durationMinutes,`);
service = service.replace(`      timeRange: toTimeRange(exam),\n      durationMinutes: exam.durationMinutes,`, `      timeRange: toTimeRange(exam),\n      startAt: exam.startAt ?? exam.startTime,\n      endAt: exam.endAt ?? exam.endTime,\n      startTime: exam.startTime,\n      endTime: exam.endTime,\n      durationMinutes: exam.durationMinutes,`);
write('apps/mindmark-web/src/services/examService.ts', service);

write('apps/mindmark-web/src/views/student/StudentExamsView.vue', `<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { STUDENT_EXAM_STATUS_META } from '@/constants/status';
import { listStudentExams } from '@/services/examService';
import type { StudentExamSummary, StudentExamStatus } from '@/types/exam';
import { getExamTimingInfo } from '@/utils/examTime';

const exams = ref<StudentExamSummary[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const nowMs = ref(Date.now());
const refreshedBoundaryKeys = new Set<string>();
let timer: number | undefined;

const loadExams = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    exams.value = await listStudentExams();
  } catch (error) {
    exams.value = [];
    errorMessage.value = error instanceof Error ? error.message : '考试安排加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const statusPriority: Record<StudentExamStatus, number> = {
  AVAILABLE: 1,
  NOT_STARTED: 2,
  SUBMITTED: 3,
  GRADED: 4,
  ENDED: 5,
  ABSENT: 6,
};

const sortedExams = computed(() =>
  [...exams.value].sort((a, b) => {
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  }),
);

const timingOf = (exam: StudentExamSummary) => getExamTimingInfo(exam.startAt, exam.endAt, nowMs.value);

const resolvedStatus = (exam: StudentExamSummary): StudentExamStatus => {
  if (exam.status === 'SUBMITTED' || exam.status === 'GRADED' || exam.status === 'ABSENT') {
    return exam.status;
  }

  const timing = timingOf(exam);
  if (timing.phase === 'IN_WINDOW') {
    return 'AVAILABLE';
  }
  if (timing.phase === 'ENDED') {
    return 'ENDED';
  }

  return exam.status;
};

const actionText = (exam: StudentExamSummary) => {
  const status = resolvedStatus(exam);
  if (status === 'SUBMITTED') {
    return '查看提交状态';
  }

  if (status === 'AVAILABLE') {
    return '阅读须知';
  }

  if (status === 'ENDED') {
    return '查看状态';
  }

  if (status === 'GRADED') {
    return '查看成绩';
  }

  return '查看安排';
};

const helperText = (exam: StudentExamSummary) => {
  if (exam.status === 'SUBMITTED') {
    return '答卷已提交，等待教师批改或成绩发布。';
  }
  if (exam.status === 'GRADED') {
    return '成绩已发布，可前往成绩中心查看反馈。';
  }
  if (exam.status === 'ABSENT') {
    return '系统记录为缺考，如有疑问请联系任课教师。';
  }

  return timingOf(exam).helperText;
};

const maybeRefreshOnTimeBoundary = () => {
  if (loading.value || exams.value.length === 0) {
    return;
  }

  const shouldRefresh = exams.value.some((exam) => {
    const timing = timingOf(exam);
    if (Number.isNaN(timing.startMs) || Number.isNaN(timing.endMs)) {
      return false;
    }

    const startKey = `${exam.id}:${exam.startAt}:start`;
    const endKey = `${exam.id}:${exam.endAt}:end`;

    if (nowMs.value >= timing.startMs && !refreshedBoundaryKeys.has(startKey)) {
      refreshedBoundaryKeys.add(startKey);
      return true;
    }

    if (nowMs.value >= timing.endMs && !refreshedBoundaryKeys.has(endKey)) {
      refreshedBoundaryKeys.add(endKey);
      return true;
    }

    return false;
  });

  if (shouldRefresh) {
    void loadExams();
  }
};

onMounted(() => {
  void loadExams();
  timer = window.setInterval(() => {
    nowMs.value = Date.now();
    maybeRefreshOnTimeBoundary();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="page-shell student-exams-page">
    <PageHeader
      title="学生考试中心"
      description="查看考试时间窗口、阅读考试须知，并在开放后进入在线答题。"
    />

    <p v-if="loading && exams.length === 0" class="muted-text loading-text">正在加载考试安排...</p>
    <ErrorState v-else-if="errorMessage" title="加载失败" :description="errorMessage">
      <AppActionButton @click="loadExams">重试</AppActionButton>
    </ErrorState>
    <EmptyState
      v-else-if="exams.length === 0"
      title="暂无考试安排"
      description="当前账号还没有可查看的考试，请等待教师发布考试。"
    />
    <section v-else class="exam-card-list student-exam-list-polished">
      <article v-for="exam in sortedExams" :key="exam.id" class="content-card student-exam-card">
        <div class="student-exam-main">
          <div class="tag-list">
            <StatusTag
              :label="STUDENT_EXAM_STATUS_META[resolvedStatus(exam)].label"
              :tone="STUDENT_EXAM_STATUS_META[resolvedStatus(exam)].tone"
            />
            <span class="soft-tag">{{ exam.courseName }}</span>
          </div>
          <h2>{{ exam.title }}</h2>
          <div class="student-exam-meta-grid">
            <span>开始 {{ exam.startTime }}</span>
            <span>结束 {{ exam.endTime }}</span>
            <span>考试时长 {{ exam.durationMinutes }} 分钟</span>
            <span>试卷满分 {{ exam.totalScore }} 分</span>
            <span v-if="exam.submittedAt">已提交 {{ exam.submittedAt }}</span>
          </div>
        </div>
        <div class="student-exam-side">
          <div
            class="student-exam-countdown"
            :class="`student-exam-countdown--${resolvedStatus(exam).toLowerCase().replace('_', '-')}`"
          >
            <span class="student-exam-countdown__label">状态提醒</span>
            <strong>{{ helperText(exam) }}</strong>
          </div>
          <AppActionButton
            variant="primary"
            icon="📋"
            :to="`/student/exams/${exam.id}/notice`"
          >
            {{ actionText(exam) }}
          </AppActionButton>
        </div>
      </article>
    </section>
  </div>
</template>
`);

write('apps/mindmark-web/src/views/student/ExamNoticeView.vue', `<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import EmptyState from '@/components/common/EmptyState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { EXAM_STATUS_META } from '@/constants/status';
import { getExamById } from '@/services/examService';
import type { Exam } from '@/types/exam';
import { getExamTimingInfo } from '@/utils/examTime';

const route = useRoute();
const exam = ref<Exam | null>(null);
const loading = ref(false);
const nowMs = ref(Date.now());
const refreshedBoundaryKeys = new Set<string>();
let timer: number | undefined;

const examId = computed(() => String(route.params.id));
const timing = computed(() => getExamTimingInfo(exam.value?.startAt ?? exam.value?.startTime, exam.value?.endAt ?? exam.value?.endTime, nowMs.value));
const canEnter = computed(() => {
  if (!exam.value) {
    return false;
  }

  if (exam.value.status === 'ENDED' || exam.value.status === 'GRADED' || exam.value.status === 'PUBLISHED') {
    return false;
  }

  return exam.value.status === 'IN_PROGRESS' || timing.value.phase === 'IN_WINDOW';
});

const enterButtonText = computed(() => {
  if (!exam.value) {
    return '考试暂不可进入';
  }
  if (timing.value.phase === 'BEFORE_START') {
    return '未到开考时间';
  }
  if (timing.value.phase === 'ENDED' || exam.value.status === 'ENDED') {
    return '考试已结束';
  }

  return '进入答题';
});

const loadExam = async () => {
  loading.value = true;
  try {
    exam.value = (await getExamById(examId.value)) ?? null;
  } finally {
    loading.value = false;
  }
};

const maybeRefreshOnTimeBoundary = () => {
  if (!exam.value || loading.value) {
    return;
  }

  const info = timing.value;
  if (Number.isNaN(info.startMs) || Number.isNaN(info.endMs)) {
    return;
  }

  const startKey = `${exam.value.id}:${exam.value.startAt ?? exam.value.startTime}:start`;
  const endKey = `${exam.value.id}:${exam.value.endAt ?? exam.value.endTime}:end`;

  if (nowMs.value >= info.startMs && !refreshedBoundaryKeys.has(startKey)) {
    refreshedBoundaryKeys.add(startKey);
    void loadExam();
    return;
  }

  if (nowMs.value >= info.endMs && !refreshedBoundaryKeys.has(endKey)) {
    refreshedBoundaryKeys.add(endKey);
    void loadExam();
  }
};

onMounted(() => {
  void loadExam();
  timer = window.setInterval(() => {
    nowMs.value = Date.now();
    maybeRefreshOnTimeBoundary();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="page-shell exam-notice-page">
    <PageHeader title="考试须知" description="进入答题前请确认考试安排、试卷信息与考试规则。">
      <template #actions>
        <AppActionButton to="/student/exams" icon="↩️">返回考试中心</AppActionButton>
      </template>
    </PageHeader>

    <p v-if="loading && !exam" class="muted-text loading-text">正在加载考试须知...</p>
    <EmptyState v-else-if="!exam" title="考试不存在" description="请返回考试中心重新选择考试。" />
    <section v-else class="content-card exam-notice-card">
      <div class="section-title exam-notice-title-row">
        <div>
          <h2>{{ exam.title }}</h2>
          <p class="muted-text">{{ exam.courseName }} · {{ exam.paper.title }}</p>
        </div>
        <StatusTag
          :label="EXAM_STATUS_META[exam.status].label"
          :tone="EXAM_STATUS_META[exam.status].tone"
        />
      </div>

      <div class="exam-notice-timing" :class="`exam-notice-timing--${timing.phase.toLowerCase().replace('_', '-')}`">
        <span>考试入口</span>
        <strong>{{ timing.helperText }}</strong>
        <small v-if="timing.phase === 'BEFORE_START'">到点后系统会自动刷新状态并启用进入按钮。</small>
        <small v-else-if="timing.phase === 'IN_WINDOW'">请确认考试规则后进入答题，答题过程会自动保存草稿。</small>
        <small v-else>如已提交答卷，请等待教师批改或成绩发布。</small>
      </div>

      <div class="paper-summary-grid">
        <div class="metric-card compact-metric">
          <span>考试时长</span>
          <strong>{{ exam.durationMinutes }} 分钟</strong>
        </div>
        <div class="metric-card compact-metric">
          <span>试卷满分</span>
          <strong>{{ exam.paper.totalScore }} 分</strong>
        </div>
        <div class="metric-card compact-metric">
          <span>题目数量</span>
          <strong>{{ exam.paper.questions.length }} 题</strong>
        </div>
      </div>

      <h2>考试规则</h2>
      <ul class="notice-list">
        <li>请在规定时间内完成答题，未到开始时间无法进入答题页。</li>
        <li>单选、判断题请选择一个答案；多选题可选择多个答案。</li>
        <li>填空、简答与编程题请按题目要求输入答案。</li>
        <li>系统会保存答题草稿；提交后进入批改流程，请勿重复登录或离开考试页面。</li>
      </ul>

      <div class="exam-notice-actions">
        <AppActionButton v-if="canEnter" variant="primary" icon="📝" :to="`/student/exams/${exam.id}/take`">
          进入答题
        </AppActionButton>
        <AppActionButton v-else disabled icon="⏱️">{{ enterButtonText }}</AppActionButton>
      </div>
    </section>
  </div>
</template>
`);

let teacherCss = read('apps/mindmark-web/src/styles/teacher.css');
if (!teacherCss.includes('.student-exam-side')) {
  teacherCss += `

.student-exam-side {
  display: grid;
  min-width: 240px;
  gap: var(--mm-space-sm);
  justify-items: end;
  align-content: center;
}

.student-exam-countdown,
.exam-notice-timing {
  display: grid;
  gap: 5px;
  padding: var(--mm-space-sm) var(--mm-space-md);
  color: var(--mm-color-text-secondary);
  background: color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: 8px;
}

.student-exam-countdown {
  width: min(100%, 300px);
  text-align: right;
}

.student-exam-countdown__label,
.exam-notice-timing span {
  font-size: 11px;
  color: var(--mm-color-text-tertiary);
}

.student-exam-countdown strong,
.exam-notice-timing strong {
  color: var(--mm-color-text-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.exam-notice-timing {
  margin: var(--mm-space-lg) 0;
}

.exam-notice-timing small {
  color: var(--mm-color-text-secondary);
  font-size: 12px;
}

.student-exam-countdown--available,
.exam-notice-timing--in-window {
  background: color-mix(in srgb, var(--mm-color-success) 7%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-success) 20%, var(--mm-color-border));
}

.student-exam-countdown--ended,
.exam-notice-timing--ended {
  background: color-mix(in srgb, var(--mm-color-warning) 8%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-warning) 24%, var(--mm-color-border));
}

.exam-notice-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--mm-space-lg);
}

@media (width <= 760px) {
  .student-exam-card {
    flex-direction: column;
  }

  .student-exam-side {
    width: 100%;
    min-width: 0;
    justify-items: stretch;
  }

  .student-exam-countdown {
    width: 100%;
    text-align: left;
  }
}
`;
}
write('apps/mindmark-web/src/styles/teacher.css', teacherCss);

write('apps/mindmark-server/scripts/maintenance/fix-auth-user-student-id.sql', `-- MindMark 数据治理脚本：修复历史 auth_user.student_id 存为学号的问题。
--
-- 背景：早期导入链路中，auth_user.student_id 可能写入 student_profile.student_no（学号），
--      当前标准应写入 student_profile.id。该脚本把可唯一匹配的历史数据统一修正为档案 ID。
--
-- 使用方式：
--   1. 执行前备份 auth_user / student_profile。
--   2. 在 mindmark 数据库执行：psql -h localhost -p 5432 -U postgres -d mindmark -f apps/mindmark-server/scripts/maintenance/fix-auth-user-student-id.sql
--   3. 执行后查看脚本末尾的 remaining_mismatch_count，若不为 0，需要人工核对。
--
-- 幂等性：可重复执行；只有 auth_user.student_id = student_profile.student_no 的记录会被更新。

BEGIN;

-- 执行前差异快照：student_id 不是 profile.id，但可通过 user_id + student_no 匹配。
CREATE TEMP TABLE IF NOT EXISTS tmp_auth_user_student_id_fix AS
SELECT
  u.id AS user_id,
  u.username,
  u.student_id AS old_student_id,
  sp.id AS expected_student_profile_id,
  sp.student_no
FROM auth_user u
JOIN student_profile sp ON sp.user_id = u.id
WHERE u.student_id IS NOT NULL
  AND u.student_id <> sp.id
  AND u.student_id = sp.student_no;

UPDATE auth_user u
SET student_id = sp.id,
    updated_at = NOW()
FROM student_profile sp
WHERE sp.user_id = u.id
  AND u.student_id IS NOT NULL
  AND u.student_id <> sp.id
  AND u.student_id = sp.student_no;

COMMIT;

-- 本次修复明细。
SELECT * FROM tmp_auth_user_student_id_fix ORDER BY username;

-- 剩余不一致数据：可能是人工创建或历史脏数据，需要单独核对，不自动修复。
SELECT COUNT(*) AS remaining_mismatch_count
FROM auth_user u
JOIN student_profile sp ON sp.user_id = u.id
WHERE u.student_id IS NOT NULL
  AND u.student_id <> sp.id;
`);
