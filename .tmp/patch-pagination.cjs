const fs = require('fs');
const p = 'apps/mindmark-web/src/views/teacher/PapersView.vue';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
s = s.replace("import { computed, onMounted, reactive, ref, watch } from 'vue';", "import { computed, onMounted, reactive, ref } from 'vue';");
s = s.replace(`watch(selectedPaperId, () => {
  paperQuestionPagination.page = 1;
  availableQuestionPagination.page = 1;
  void loadSelectedPaperRelated();
});

`, `const selectPaper = (paperId: string) => {
  if (selectedPaperId.value === paperId) {
    return;
  }

  selectedPaperId.value = paperId;
  paperQuestionPagination.page = 1;
  availableQuestionPagination.page = 1;
  void loadSelectedPaperRelated();
};

`);
s = s.replace('@click="selectedPaperId = paper.id"', '@click="selectPaper(paper.id)"');
fs.writeFileSync(p, s, 'utf8');
