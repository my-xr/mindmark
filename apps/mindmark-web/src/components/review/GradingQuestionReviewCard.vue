<script setup lang="ts">
import { computed } from 'vue';

import AppFormControl from '@/components/common/AppFormControl.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { GRADING_TASK_STATUS_META } from '@/constants/status';
import type { QuestionGrade } from '@/types/grading';

const props = defineProps<{
  disabled?: boolean;
  grade: QuestionGrade;
  score: number;
}>();

const emit = defineEmits<{
  updateScore: [questionId: string, score: number];
}>();

const scoreModel = computed({
  get: () => props.score,
  set: (value: null | number | string | undefined) => {
    const numericScore = Number(value ?? 0);
    emit('updateScore', props.grade.questionId, Number.isFinite(numericScore) ? numericScore : 0);
  },
});

const formatAnswer = (answer: string | string[]) =>
  Array.isArray(answer) ? answer.join('、') : answer || '未作答';

const gradingModeLabel = computed(() =>
  props.grade.gradingMode === 'AUTO' ? '客观题系统判分' : 'AI 主观题判分',
);

const gradeAuditText = computed(() => {
  const sourceMap: Record<string, string> = {
    AI_PROVIDER: 'AI Provider 判分',
    AUTO_RULE: '客观题规则判分',
    BASELINE: '系统基线判分',
    TEACHER_REVIEW: '教师复核覆盖',
  };
  const grade = props.grade;
  const parts = [sourceMap[grade.gradingSource ?? ''] ?? grade.gradingSource];
  if (grade.aiProvider && grade.aiModel) {
    parts.push(`${grade.aiProvider}/${grade.aiModel}`);
  }
  if (grade.aiRubricVersion) {
    parts.push(`规则 ${grade.aiRubricVersion}`);
  }
  if (grade.scoreDiff && Math.abs(grade.scoreDiff) >= 0.01) {
    parts.push(`改分差 ${grade.scoreDiff > 0 ? '+' : ''}${grade.scoreDiff}`);
  }

  return parts.filter(Boolean).join(' · ');
});
</script>

<template>
  <article class="review-question-card">
    <div class="section-title">
      <div class="tag-list">
        <span class="soft-tag">第 {{ grade.order }} 题</span>
        <span class="soft-tag">{{ grade.type }}</span>
        <span class="soft-tag">满分 {{ grade.maxScore }}</span>
        <span v-if="grade.correct === true" class="soft-tag soft-tag--success">答对</span>
        <span v-else-if="grade.correct === false" class="soft-tag soft-tag--danger">答错</span>
        <span v-if="grade.needsReview" class="soft-tag soft-tag--warning">需复核</span>
      </div>
      <StatusTag
        :label="GRADING_TASK_STATUS_META[grade.status].label"
        :tone="GRADING_TASK_STATUS_META[grade.status].tone"
      />
    </div>
    <h3 class="review-question-title" :title="grade.title">{{ grade.title }}</h3>
    <div class="grading-score-grid">
      <div>
        <strong>学生答案</strong>
        <p>{{ formatAnswer(grade.studentAnswer) }}</p>
      </div>
      <div>
        <strong>参考答案</strong>
        <p>{{ formatAnswer(grade.referenceAnswer) }}</p>
      </div>
      <div>
        <strong>{{ gradingModeLabel }}</strong>
        <p>
          {{ grade.autoScore ?? grade.aiSuggestedScore ?? 0 }}/{{ grade.maxScore }}
          <span v-if="grade.aiConfidence"> · 置信度 {{ grade.aiConfidence }}</span>
        </p>
        <p v-if="grade.aiComment" class="muted-text">{{ grade.aiComment }}</p>
        <p v-if="gradeAuditText" class="muted-text grading-audit-text">
          {{ gradeAuditText }}
        </p>
        <p v-if="grade.teacherOverrideReason" class="muted-text">
          复核备注：{{ grade.teacherOverrideReason }}
        </p>
        <p v-if="grade.riskLabel" class="muted-text danger-text">{{ grade.riskLabel }}</p>
      </div>
    </div>
    <div class="score-input-row grading-question-score-row">
      <AppFormControl
        v-model="scoreModel"
        class="grading-question-score-input"
        label="教师复核分（默认系统分）"
        type="number"
        min="0"
        :max="grade.maxScore"
        :disabled="disabled"
      />
      <small>/ {{ grade.maxScore }}</small>
    </div>
  </article>
</template>
