<script setup lang="ts">
import StatusTag from '@/components/common/StatusTag.vue';
import { DIFFICULTY_META } from '@/constants/question';
import type { Difficulty } from '@/types/question';

interface DifficultyTagProps {
  difficulty: Difficulty;
}

defineProps<DifficultyTagProps>();
</script>

<template>
  <StatusTag :label="DIFFICULTY_META[difficulty].label" :tone="DIFFICULTY_META[difficulty].tone" />
</template>
