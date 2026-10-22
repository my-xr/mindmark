const fs = require('fs');

const writeUtf8 = (file, content) => fs.writeFileSync(file, content, 'utf8');

const componentPath = 'apps/mindmark-web/src/components/common/OptionChipGroup.vue';
const component = `<script setup lang="ts">
import { computed } from 'vue';

export interface OptionChipItem {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: readonly OptionChipItem[];
    modelValue: string;
    ariaLabel: string;
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const visibleOptions = computed(() => {
  if (!props.collapsed) {
    return props.options;
  }

  const selected = props.options.find((option) => option.value === props.modelValue);
  if (!selected) {
    return props.options;
  }

  return [selected, ...props.options.filter((option) => option.value !== props.modelValue)];
});

const selectOption = (option: OptionChipItem) => {
  if (option.disabled || option.value === props.modelValue) {
    return;
  }

  emit('update:modelValue', option.value);
};
</script>

<template>
  <div class="filter-option-group" role="group" :aria-label="ariaLabel">
    <button
      v-for="option in visibleOptions"
      :key="option.value"
      class="filter-option-chip"
      :class="{ 'filter-option-chip--active': modelValue === option.value }"
      type="button"
      :aria-pressed="modelValue === option.value"
      :disabled="option.disabled"
      @click="selectOption(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
`;
writeUtf8(componentPath, component);

const replaceOnce = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`replacement failed: ${label}`);
  return next;
};

const chipBlockPattern = (label, ariaLabel) =>
  new RegExp(
    `<div class="form-field filter-option-field">\\r?\\n\\s*<span>${label}<\\/span>\\r?\\n\\s*<div class="filter-option-group" aria-label="${ariaLabel}">[\\s\\S]*?\\r?\\n\\s*<\\/div>\\r?\\n\\s*<\\/div>`,
  );

let p = 'apps/mindmark-web/src/views/teacher/QuestionBankView.vue';
let s = fs.readFileSync(p, 'utf8');
s = replaceOnce(s, "import { computed, reactive, ref, watch } from 'vue';", "import { reactive, ref, watch } from 'vue';", 'question vue import');
s = replaceOnce(s, "import PageHeader from '@/components/common/PageHeader.vue';", "import OptionChipGroup from '@/components/common/OptionChipGroup.vue';\nimport PageHeader from '@/components/common/PageHeader.vue';", 'question component import');
s = s.replace(/\nconst prioritizeSelectedOption = <T extends string>\([\s\S]*?\n\};\n/, '\n');
s = s.replace(/\nconst visibleTypeFilterOptions = computed\(\(\) =>[\s\S]*?const visibleSourceFilterOptions = computed\(\(\) =>[\s\S]*?\n\);\n/, '\n');
s = replaceOnce(
  s,
  `const resetFilters = () => {
  query.keyword = '';
  query.type = 'ALL';
  query.difficulty = 'ALL';
  query.status = 'ALL';
  query.source = 'ALL';
};`,
  `const resetFilters = () => {
  query.keyword = '';
  query.type = 'ALL';
  query.difficulty = 'ALL';
  query.status = 'ALL';
  query.source = 'ALL';
};

const setTypeFilter = (value: string) => {
  query.type = value as FilterState['type'];
};

const setDifficultyFilter = (value: string) => {
  query.difficulty = value as FilterState['difficulty'];
};

const setStatusFilter = (value: string) => {
  query.status = value as FilterState['status'];
};

const setSourceFilter = (value: string) => {
  query.source = value as FilterState['source'];
};`,
  'question setters',
);
const qType = '\u9898\u578b';
const qDifficulty = '\u96be\u5ea6';
const qStatus = '\u72b6\u6001';
const qSource = '\u6765\u6e90';
s = replaceOnce(
  s,
  chipBlockPattern(qType, '\u9898\u578b\u7b5b\u9009'),
  `<div class="form-field filter-option-field">
          <span>\u9898\u578b</span>
          <OptionChipGroup
            aria-label="\u9898\u578b\u7b5b\u9009"
            :collapsed="isFilterCollapsed"
            :model-value="query.type"
            :options="typeFilterOptions"
            @update:model-value="setTypeFilter"
          />
        </div>`,
  'question type chip group',
);
s = replaceOnce(
  s,
  chipBlockPattern(qDifficulty, '\u96be\u5ea6\u7b5b\u9009'),
  `<div class="form-field filter-option-field">
          <span>\u96be\u5ea6</span>
          <OptionChipGroup
            aria-label="\u96be\u5ea6\u7b5b\u9009"
            :collapsed="isFilterCollapsed"
            :model-value="query.difficulty"
            :options="difficultyFilterOptions"
            @update:model-value="setDifficultyFilter"
          />
        </div>`,
  'question difficulty chip group',
);
s = replaceOnce(
  s,
  chipBlockPattern(qStatus, '\u72b6\u6001\u7b5b\u9009'),
  `<div class="form-field filter-option-field">
          <span>\u72b6\u6001</span>
          <OptionChipGroup
            aria-label="\u72b6\u6001\u7b5b\u9009"
            :collapsed="isFilterCollapsed"
            :model-value="query.status"
            :options="statusFilterOptions"
            @update:model-value="setStatusFilter"
          />
        </div>`,
  'question status chip group',
);
s = replaceOnce(
  s,
  chipBlockPattern(qSource, '\u6765\u6e90\u7b5b\u9009'),
  `<div class="form-field filter-option-field">
          <span>\u6765\u6e90</span>
          <OptionChipGroup
            aria-label="\u6765\u6e90\u7b5b\u9009"
            :collapsed="isFilterCollapsed"
            :model-value="query.source"
            :options="sourceFilterOptions"
            @update:model-value="setSourceFilter"
          />
        </div>`,
  'question source chip group',
);
writeUtf8(p, s);

p = 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue';
s = fs.readFileSync(p, 'utf8');
s = replaceOnce(s, "import { computed, onMounted, reactive, ref } from 'vue';", "import { onMounted, reactive, ref } from 'vue';", 'ai vue import');
s = replaceOnce(s, "import PageHeader from '@/components/common/PageHeader.vue';", "import OptionChipGroup from '@/components/common/OptionChipGroup.vue';\nimport PageHeader from '@/components/common/PageHeader.vue';", 'ai component import');
s = s.replace(/\nconst prioritizeSelectedOption = <T extends string>\([\s\S]*?\n\};\n/, '\n');
s = s.replace(/\nconst visibleTypeOptions = computed\(\(\) =>[\s\S]*?const visibleDifficultyOptions = computed\(\(\) =>[\s\S]*?\n\);\n/, '\n');
s = replaceOnce(
  s,
  `const canReview = (draft: AiQuestionDraft) => draft.reviewStatus === 'PENDING';`,
  `const canReview = (draft: AiQuestionDraft) => draft.reviewStatus === 'PENDING';

const setQuestionType = (value: string) => {
  form.type = value as QuestionType;
};

const setDifficulty = (value: string) => {
  form.difficulty = value as Difficulty;
};`,
  'ai setters',
);
s = replaceOnce(
  s,
  chipBlockPattern(qType, '\u751f\u6210\u9898\u578b\u9009\u62e9'),
  `<div class="form-field filter-option-field">
          <span>\u9898\u578b</span>
          <OptionChipGroup
            aria-label="\u751f\u6210\u9898\u578b\u9009\u62e9"
            :collapsed="isGenerateCollapsed"
            :model-value="form.type"
            :options="typeOptions"
            @update:model-value="setQuestionType"
          />
        </div>`,
  'ai type chip group',
);
s = replaceOnce(
  s,
  chipBlockPattern(qDifficulty, '\u751f\u6210\u96be\u5ea6\u9009\u62e9'),
  `<div class="form-field filter-option-field">
          <span>\u96be\u5ea6</span>
          <OptionChipGroup
            aria-label="\u751f\u6210\u96be\u5ea6\u9009\u62e9"
            :collapsed="isGenerateCollapsed"
            :model-value="form.difficulty"
            :options="difficultyOptions"
            @update:model-value="setDifficulty"
          />
        </div>`,
  'ai difficulty chip group',
);
writeUtf8(p, s);
