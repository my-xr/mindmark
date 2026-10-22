const fs = require('fs');

const writeUtf8NoBom = (file, content) => {
  fs.writeFileSync(file, content, { encoding: 'utf8' });
};

const replaceOnce = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`replacement failed: ${label}`);
  }
  return next;
};

const qb = 'apps/mindmark-web/src/views/teacher/QuestionBankView.vue';
let s = fs.readFileSync(qb, 'utf8');

s = replaceOnce(
  s,
  /const sourceOptions = Object\.entries\(SOURCE_META\)\.map\(\(\[value, label\]\) => \(\{\r?\n  value: value as QuestionSource,\r?\n  label,\r?\n\}\)\);/,
  `const sourceOptions = Object.entries(SOURCE_META).map(([value, label]) => ({
  value: value as QuestionSource,
  label,
}));

const typeFilterOptions: Array<{ value: QuestionType | 'ALL'; label: string }> = [
  { value: 'ALL', label: '\u5168\u90e8' },
  ...typeOptions,
];
const difficultyFilterOptions: Array<{ value: Difficulty | 'ALL'; label: string }> = [
  { value: 'ALL', label: '\u5168\u90e8' },
  ...difficultyOptions,
];
const statusFilterOptions: Array<{ value: QuestionStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '\u5168\u90e8' },
  ...statusOptions,
];
const sourceFilterOptions: Array<{ value: QuestionSource | 'ALL'; label: string }> = [
  { value: 'ALL', label: '\u5168\u90e8' },
  ...sourceOptions,
];`,
  'question filter option arrays',
);

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u9898\u578b<\\/span>\\r?\\n\\s*<select v-model="query\\.type" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u9898\u578b</span>
          <div class="filter-option-group" aria-label="\u9898\u578b\u7b5b\u9009">
            <button
              v-for="option in typeFilterOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': query.type === option.value }"
              type="button"
              :aria-pressed="query.type === option.value"
              @click="query.type = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'question type select',
);

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u96be\u5ea6<\\/span>\\r?\\n\\s*<select v-model="query\\.difficulty" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u96be\u5ea6</span>
          <div class="filter-option-group" aria-label="\u96be\u5ea6\u7b5b\u9009">
            <button
              v-for="option in difficultyFilterOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': query.difficulty === option.value }"
              type="button"
              :aria-pressed="query.difficulty === option.value"
              @click="query.difficulty = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'question difficulty select',
);

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u72b6\u6001<\\/span>\\r?\\n\\s*<select v-model="query\\.status" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u72b6\u6001</span>
          <div class="filter-option-group" aria-label="\u72b6\u6001\u7b5b\u9009">
            <button
              v-for="option in statusFilterOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': query.status === option.value }"
              type="button"
              :aria-pressed="query.status === option.value"
              @click="query.status = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'question status select',
);

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u6765\u6e90<\\/span>\\r?\\n\\s*<select v-model="query\\.source" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u6765\u6e90</span>
          <div class="filter-option-group" aria-label="\u6765\u6e90\u7b5b\u9009">
            <button
              v-for="option in sourceFilterOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': query.source === option.value }"
              type="button"
              :aria-pressed="query.source === option.value"
              @click="query.source = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'question source select',
);

writeUtf8NoBom(qb, s);

const ai = 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue';
s = fs.readFileSync(ai, 'utf8');

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u9898\u578b<\\/span>\\r?\\n\\s*<select v-model="form\\.type" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u9898\u578b</span>
          <div class="filter-option-group" aria-label="\u751f\u6210\u9898\u578b\u9009\u62e9">
            <button
              v-for="option in typeOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': form.type === option.value }"
              type="button"
              :aria-pressed="form.type === option.value"
              @click="form.type = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'ai type select',
);

s = replaceOnce(
  s,
  new RegExp(`<label class="form-field">\\r?\\n\\s*<span>\u96be\u5ea6<\\/span>\\r?\\n\\s*<select v-model="form\\.difficulty" class="select-input">[\\s\\S]*?\\r?\\n\\s*<\\/label>`),
  `<div class="form-field filter-option-field">
          <span>\u96be\u5ea6</span>
          <div class="filter-option-group" aria-label="\u751f\u6210\u96be\u5ea6\u9009\u62e9">
            <button
              v-for="option in difficultyOptions"
              :key="option.value"
              class="filter-option-chip"
              :class="{ 'filter-option-chip--active': form.difficulty === option.value }"
              type="button"
              :aria-pressed="form.difficulty === option.value"
              @click="form.difficulty = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>`,
  'ai difficulty select',
);

writeUtf8NoBom(ai, s);
