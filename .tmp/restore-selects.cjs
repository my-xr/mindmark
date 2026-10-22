const fs = require('fs');

const replaceOnce = (source, pattern, replacement, label) => {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`replacement failed: ${label}`);
  return next;
};

let p = 'apps/mindmark-web/src/views/teacher/QuestionBankView.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("import OptionChipGroup from '@/components/common/OptionChipGroup.vue';\n", '');
s = s.replace(/\nconst typeFilterOptions:[\s\S]*?const sourceFilterOptions:[\s\S]*?\n\];\n/, '\n');
s = s.replace(/\nconst setTypeFilter = \(value: string\) =>[\s\S]*?const setSourceFilter = \(value: string\) =>[\s\S]*?\n\};\n/, '\n');
const qType = '\u9898\u578b';
const qDifficulty = '\u96be\u5ea6';
const qStatus = '\u72b6\u6001';
const qSource = '\u6765\u6e90';
const chipComponentBlock = (label) =>
  new RegExp(
    `<div class="form-field filter-option-field">\\r?\\n\\s*<span>${label}<\\/span>\\r?\\n\\s*<OptionChipGroup[\\s\\S]*?\\r?\\n\\s*<\\/div>`,
  );
s = replaceOnce(
  s,
  chipComponentBlock(qType),
  `<label class="form-field">
          <span>\u9898\u578b</span>
          <select v-model="query.type" class="select-input">
            <option value="ALL">\u5168\u90e8</option>
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'question type select restore',
);
s = replaceOnce(
  s,
  chipComponentBlock(qDifficulty),
  `<label class="form-field">
          <span>\u96be\u5ea6</span>
          <select v-model="query.difficulty" class="select-input">
            <option value="ALL">\u5168\u90e8</option>
            <option v-for="option in difficultyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'question difficulty select restore',
);
s = replaceOnce(
  s,
  chipComponentBlock(qStatus),
  `<label class="form-field">
          <span>\u72b6\u6001</span>
          <select v-model="query.status" class="select-input">
            <option value="ALL">\u5168\u90e8</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'question status select restore',
);
s = replaceOnce(
  s,
  chipComponentBlock(qSource),
  `<label class="form-field">
          <span>\u6765\u6e90</span>
          <select v-model="query.source" class="select-input">
            <option value="ALL">\u5168\u90e8</option>
            <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'question source select restore',
);
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue';
s = fs.readFileSync(p, 'utf8');
s = s.replace("import OptionChipGroup from '@/components/common/OptionChipGroup.vue';\n", '');
s = s.replace(/\nconst setQuestionType = \(value: string\) =>[\s\S]*?const setDifficulty = \(value: string\) =>[\s\S]*?\n\};\n/, '\n');
s = replaceOnce(
  s,
  chipComponentBlock(qType),
  `<label class="form-field">
          <span>\u9898\u578b</span>
          <select v-model="form.type" class="select-input">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'ai type select restore',
);
s = replaceOnce(
  s,
  chipComponentBlock(qDifficulty),
  `<label class="form-field">
          <span>\u96be\u5ea6</span>
          <select v-model="form.difficulty" class="select-input">
            <option v-for="option in difficultyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>`,
  'ai difficulty select restore',
);
fs.writeFileSync(p, s, 'utf8');

const componentPath = 'apps/mindmark-web/src/components/common/OptionChipGroup.vue';
if (fs.existsSync(componentPath)) {
  fs.unlinkSync(componentPath);
}
