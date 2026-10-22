const fs = require('fs');
const replaceAll = (s, a, b) => s.split(a).join(b);
let p = 'apps/mindmark-web/src/components/common/OptionChipGroup.vue';
let s = fs.readFileSync(p, 'utf8');
s = replaceAll(s, 'ariaLabel: string;', 'label: string;');
s = replaceAll(s, ':aria-label="ariaLabel"', ':aria-label="label"');
fs.writeFileSync(p, s, 'utf8');
for (const p of ['apps/mindmark-web/src/views/teacher/QuestionBankView.vue','apps/mindmark-web/src/views/teacher/AiQuestionsView.vue']) {
  let s = fs.readFileSync(p, 'utf8');
  s = replaceAll(s, 'aria-label="????"', 'label="????"');
  s = replaceAll(s, 'aria-label="????"', 'label="????"');
  s = replaceAll(s, 'aria-label="????"', 'label="????"');
  s = replaceAll(s, 'aria-label="????"', 'label="????"');
  s = replaceAll(s, 'aria-label="??????"', 'label="??????"');
  s = replaceAll(s, 'aria-label="??????"', 'label="??????"');
  fs.writeFileSync(p, s, 'utf8');
}
