<script setup lang="ts">
import { computed } from 'vue';

import { toQuestionRichTextSegments } from '@/utils/markdownQuestionText';

const props = withDefaults(
  defineProps<{
    text?: string;
    tone?: 'body' | 'title';
  }>(),
  {
    text: '',
    tone: 'body',
  },
);

const segments = computed(() => toQuestionRichTextSegments(props.text));
</script>

<template>
  <div :class="['question-rich-text', `question-rich-text--${tone}`]">
    <template v-if="segments.length">
      <template v-for="segment in segments" :key="segment.id">
        <pre
          v-if="segment.kind === 'code'"
          class="question-rich-text__code"
        ><code>{{ segment.text }}</code></pre>
        <p v-else class="question-rich-text__paragraph">{{ segment.text }}</p>
      </template>
    </template>
    <p v-else class="question-rich-text__paragraph question-rich-text__empty">暂无内容</p>
  </div>
</template>

<style scoped>
.question-rich-text {
  display: grid;
  gap: 8px;
  min-width: 0;
  color: var(--mm-color-text);
  line-height: 1.75;
}

.question-rich-text__paragraph {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.question-rich-text--title {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.65;
}

.question-rich-text--body {
  font-size: 13px;
}

.question-rich-text__code {
  max-width: 100%;
  padding: 12px 14px;
  margin: 0;
  overflow: auto;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.65;
  background: #0f172a;
  border: 1px solid rgb(148 163 184 / 24%);
  border-radius: 7px;
}

.question-rich-text__code code {
  font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
}

.question-rich-text__empty {
  color: var(--mm-color-text-tertiary);
}
</style>
