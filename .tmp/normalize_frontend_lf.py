from pathlib import Path
for file in [
    'apps/mindmark-web/src/services/questionService.ts',
    'apps/mindmark-web/src/views/teacher/QuestionBankView.vue',
    'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue',
]:
    p = Path(file)
    text = p.read_text(encoding='utf-8')
    with p.open('w', encoding='utf-8', newline='\n') as f:
        f.write(text)
