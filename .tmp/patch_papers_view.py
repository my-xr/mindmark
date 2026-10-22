from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8')
start=s.find('const removeQuestion = async')
end=s.find('\n\nconst markReady', start)
if start<0 or end<0:
    raise SystemExit('function bounds not found')
new='''const removeQuestion = async (paperQuestionRef: string) => {\n  if (!selectedPaper.value) {\n    return;\n  }\n\n  const confirmed = requestUserConfirmation('确认从当前试卷中移除该题目吗？');\n\n  if (!confirmed) {\n    return;\n  }\n\n  operating.value = true;\n  errorMessage.value = null;\n  try {\n    refreshPapers(await removeQuestionFromPaper(selectedPaper.value.id, paperQuestionRef));\n    operationMessage.value = '题目已从试卷中移除，试卷分值与题号已自动重排。';\n  } catch (error) {\n    errorMessage.value = getErrorMessage(error, '题目从试卷移除失败，请稍后重试');\n  } finally {\n    operating.value = false;\n  }\n};'''
s=s[:start]+new+s[end:]
s=s.replace('@click="removeQuestion(item.questionId)"', '@click="removeQuestion(item.id)"')
s=s.replace("operationMessage.value = '题目已加入试卷，当前为前端 Mock 结果。';", "operationMessage.value = '题目已加入试卷，试卷分值已自动更新。';")
p.write_text(s, encoding='utf-8', newline='\n')
