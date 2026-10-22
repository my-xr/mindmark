from pathlib import Path
p = Path('D:/vc/MindMark/apps/mindmark-web/src/views/teacher/PapersView.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('v-if="papers.length > paperPagination.pageSize"', 'v-if="papers.length > 0"')
s = s.replace('v-if="selectedPaperQuestions.length > paperQuestionPagination.pageSize"', 'v-if="selectedPaperQuestions.length > 0"')
s = s.replace('v-if="availableQuestions.length > availableQuestionPagination.pageSize"', 'v-if="availableQuestions.length > 0"')
p.write_text(s, encoding='utf-8', newline='\n')
