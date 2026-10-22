<script setup lang="ts">
import { computed } from 'vue';

import StatusTag from '@/components/common/StatusTag.vue';
import AiConfidenceTag from '@/components/question/AiConfidenceTag.vue';
import DifficultyTag from '@/components/question/DifficultyTag.vue';
import QuestionRichText from '@/components/question/QuestionRichText.vue';
import QuestionTypeTag from '@/components/question/QuestionTypeTag.vue';
import { AI_REVIEW_STATUS_META, AI_RISK_META } from '@/constants/status';
import type { StatusMeta } from '@/constants/status';
import type { AiQuestionDraft, AiRiskCode, Question } from '@/types/question';

interface QuestionPreviewCardProps {
  item: Question | AiQuestionDraft;
  showAiMeta?: boolean;
}

const props = withDefaults(defineProps<QuestionPreviewCardProps>(), {
  showAiMeta: false,
});

const isAiDraft = (item: Question | AiQuestionDraft): item is AiQuestionDraft =>
  'confidence' in item;

const aiDraft = computed(() => (isAiDraft(props.item) ? props.item : null));

const displayAnswer = computed(() => {
  if (Array.isArray(props.item.answer)) {
    return props.item.answer.join('、');
  }

  return props.item.answer;
});

const emptyMeta: StatusMeta = { label: '未知风险', tone: 'default' };

const getRiskMeta = (riskCode: AiRiskCode) => AI_RISK_META[riskCode] ?? emptyMeta;
</script>

<template>
  <article class="preview-card">
    <header class="preview-card-header">
      <div>
        <div class="tag-list">
          <QuestionTypeTag :type="item.type" />
          <DifficultyTag :difficulty="item.difficulty" />
          <StatusTag :label="`${item.score} 分`" tone="default" />
          <AiConfidenceTag v-if="showAiMeta && aiDraft" :confidence="aiDraft.confidence" />
        </div>
        <QuestionRichText :text="item.title" tone="title" />
      </div>
      <StatusTag
        v-if="showAiMeta && aiDraft"
        :label="AI_REVIEW_STATUS_META[aiDraft.reviewStatus].label"
        :tone="AI_REVIEW_STATUS_META[aiDraft.reviewStatus].tone"
      />
    </header>

    <section class="preview-section">
      <h4>知识点</h4>
      <div class="tag-list">
        <span v-for="point in item.knowledgePoints" :key="point" class="soft-tag">{{ point }}</span>
      </div>
    </section>

    <section v-if="item.options.length" class="preview-section">
      <h4>选项</h4>
      <ol class="option-preview-list">
        <li v-for="option in item.options" :key="option.key">
          <strong>{{ option.key }}.</strong>
          <span>{{ option.content }}</span>
        </li>
      </ol>
    </section>

    <section class="preview-section">
      <h4>参考答案</h4>
      <QuestionRichText :text="displayAnswer" />
    </section>

    <section class="preview-section">
      <h4>解析</h4>
      <QuestionRichText :text="item.analysis" />
    </section>

    <section v-if="item.scoringPoints.length" class="preview-section">
      <h4>得分点</h4>
      <ul class="scoring-point-list">
        <li v-for="point in item.scoringPoints" :key="point.id">
          <strong>{{ point.score }} 分</strong>
          <span>{{ point.description }}</span>
          <small>{{ point.required ? '必需' : '可选' }} · {{ point.keywords.join('、') }}</small>
        </li>
      </ul>
    </section>

    <section v-if="showAiMeta && aiDraft" class="preview-section">
      <h4>AI 风险提示</h4>
      <div class="risk-list">
        <StatusTag v-if="!aiDraft.riskCodes.length" label="未发现明显风险" tone="success" />
        <StatusTag
          v-for="riskCode in aiDraft.riskCodes"
          :key="riskCode"
          :label="getRiskMeta(riskCode).label"
          :tone="getRiskMeta(riskCode).tone"
        />
      </div>
      <p class="muted-text">模型：{{ aiDraft.model }} · 生成于：{{ aiDraft.generatedAt }}</p>
    </section>
  </article>
</template>
