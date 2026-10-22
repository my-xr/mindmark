from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
old='''    if (composingQuestion.value?.id === question.id) {
      closeCompose();
    }
    await loadQuestions();
'''
new='''    if (composingQuestion.value?.id === question.id) {
      closeCompose();
    }
    if (!result.physicallyDeleted && query.status === 'ALL') {
      query.status = 'ACTIVE';
      pagination.page = 1;
      showFeedback(`${describeDeleteResult(result)} 已切换到「已入库」状态，避免停用题继续干扰组卷。`, 'success');
      return;
    }
    await loadQuestions();
'''
if old not in s:
    raise SystemExit('delete load block not found')
s=s.replace(old,new)
p.write_text(s, encoding='utf-8', newline='\n')
