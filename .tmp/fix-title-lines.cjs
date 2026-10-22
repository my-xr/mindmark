const fs = require('fs');
const p = 'apps/mindmark-web/src/views/teacher/PapersView.vue';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const idx = lines.findIndex((line) => line.includes(':title="`r`n') && line.includes('isPaperDeleteDisabled(selectedPaper)'));
if (idx !== -1) {
  lines.splice(
    idx,
    1,
    '              :title="',
    "                isPaperDeleteDisabled(selectedPaper) ? '\u5df2\u53d1\u5e03\u6216\u5f52\u6863\u8bd5\u5377\u4e0d\u80fd\u5220\u9664' : '\u5220\u9664\u5f53\u524d\u8bd5\u5377'",
    '              "',
  );
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
