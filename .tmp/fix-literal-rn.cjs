const fs = require('fs');
const p = 'apps/mindmark-web/src/views/teacher/PapersView.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('<button`r`n              class="paper-list-item__clickable"`r`n              type="button"`r`n              @click="openPaperEditor(paper.id)"`r`n            >', '<button\n              class="paper-list-item__clickable"\n              type="button"\n              @click="openPaperEditor(paper.id)"\n            >');
s = s.replace(':title="`r`n                isPaperDeleteDisabled(selectedPaper) ? \'????????????\' : \'??????\'`r`n              "', ':title="\n                isPaperDeleteDisabled(selectedPaper) ? \'????????????\' : \'??????\'\n              "');
fs.writeFileSync(p, s, 'utf8');
