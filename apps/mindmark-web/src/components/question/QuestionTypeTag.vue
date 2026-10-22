<script setup lang="ts">
import StatusTag from '@/components/common/StatusTag.vue';
import { QUESTION_TYPE_META } from '@/constants/question';
import type { QuestionType } from '@/types/question';

interface QuestionTypeTagProps {
  type: QuestionType;
  short?: boolean;
}

withDefaults(defineProps<QuestionTypeTagProps>(), {
  short: false,
});
</script>

<template>
  <StatusTag
    :label="short ? QUESTION_TYPE_META[type].shortLabel : QUESTION_TYPE_META[type].label"
    :tone="QUESTION_TYPE_META[type].tone"
  />
</template>
