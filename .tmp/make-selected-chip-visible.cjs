const fs = require('fs');
const replaceOnce = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`replacement failed: ${label}`);
  return next;
};

let p = 'apps/mindmark-web/src/views/teacher/QuestionBankView.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("import { reactive, ref, watch } from 'vue';", "import { computed, reactive, ref, watch } from 'vue';");
if (!s.includes('const prioritizeSelectedOption = <T extends string>')) {
  s = replaceOnce(
    s,
    /(const sourceFilterOptions:[\s\S]*?\];)(\r?\n\r?\nconst query)/,
    `$1

const prioritizeSelectedOption = <T extends string>(
  options: Array<{ value: T; label: string }>,
  selectedValue: T,
) => {
  const selected = options.find((option) => option.value === selectedValue);
  if (!selected) {
    return options;
  }
  return [selected, ...options.filter((option) => option.value !== selectedValue)];
};$2`,
    'question prioritize helper',
  );
}
if (!s.includes('const visibleTypeFilterOptions = computed')) {
  s = replaceOnce(
    s,
    /const loading = ref\(false\);\r?\nconst errorMessage = ref<string \| null>\(null\);\r?\nconst isFilterCollapsed = ref\(true\);/,
    `const loading = ref(false);
const errorMessage = ref<string | null>(null);
const isFilterCollapsed = ref(true);

const visibleTypeFilterOptions = computed(() =>
  isFilterCollapsed.value
    ? prioritizeSelectedOption(typeFilterOptions, query.type)
    : typeFilterOptions,
);
const visibleDifficultyFilterOptions = computed(() =>
  isFilterCollapsed.value
    ? prioritizeSelectedOption(difficultyFilterOptions, query.difficulty)
    : difficultyFilterOptions,
);
const visibleStatusFilterOptions = computed(() =>
  isFilterCollapsed.value
    ? prioritizeSelectedOption(statusFilterOptions, query.status)
    : statusFilterOptions,
);
const visibleSourceFilterOptions = computed(() =>
  isFilterCollapsed.value
    ? prioritizeSelectedOption(sourceFilterOptions, query.source)
    : sourceFilterOptions,
);`,
    'question visible options',
  );
}
s = s
  .replace(/v-for="option in typeFilterOptions"/g, 'v-for="option in visibleTypeFilterOptions"')
  .replace(/v-for="option in difficultyFilterOptions"/g, 'v-for="option in visibleDifficultyFilterOptions"')
  .replace(/v-for="option in statusFilterOptions"/g, 'v-for="option in visibleStatusFilterOptions"')
  .replace(/v-for="option in sourceFilterOptions"/g, 'v-for="option in visibleSourceFilterOptions"');
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue';
s = fs.readFileSync(p, 'utf8');
s = s.replace("import { onMounted, reactive, ref } from 'vue';", "import { computed, onMounted, reactive, ref } from 'vue';");
if (!s.includes('const prioritizeSelectedOption = <T extends string>')) {
  s = replaceOnce(
    s,
    /(const difficultyOptions = Object\.entries\(DIFFICULTY_META\)\.map\(\(\[value, meta\]\) => \(\{[\s\S]*?\}\)\);)(\r?\n\r?\nconst form)/,
    `$1

const prioritizeSelectedOption = <T extends string>(
  options: Array<{ value: T; label: string }>,
  selectedValue: T,
) => {
  const selected = options.find((option) => option.value === selectedValue);
  if (!selected) {
    return options;
  }
  return [selected, ...options.filter((option) => option.value !== selectedValue)];
};$2`,
    'ai prioritize helper',
  );
}
if (!s.includes('const visibleTypeOptions = computed')) {
  s = replaceOnce(
    s,
    /const isGenerating = ref\(false\);\r?\nconst reviewingId = ref<string \| null>\(null\);\r?\nconst isGenerateCollapsed = ref\(false\);/,
    `const isGenerating = ref(false);
const reviewingId = ref<string | null>(null);
const isGenerateCollapsed = ref(false);

const visibleTypeOptions = computed(() =>
  isGenerateCollapsed.value ? prioritizeSelectedOption(typeOptions, form.type) : typeOptions,
);
const visibleDifficultyOptions = computed(() =>
  isGenerateCollapsed.value
    ? prioritizeSelectedOption(difficultyOptions, form.difficulty)
    : difficultyOptions,
);`,
    'ai visible options',
  );
}
s = s
  .replace(/v-for="option in typeOptions"/g, 'v-for="option in visibleTypeOptions"')
  .replace(/v-for="option in difficultyOptions"/g, 'v-for="option in visibleDifficultyOptions"');
fs.writeFileSync(p, s, 'utf8');
