from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/GradingView.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("import OperationNotice from '@/components/common/OperationNotice.vue';\nimport StatusTag from '@/components/common/StatusTag.vue';", "import OperationNotice from '@/components/common/OperationNotice.vue';\nimport StatusTag from '@/components/common/StatusTag.vue';\nimport GradingQuestionReviewCard from '@/components/review/GradingQuestionReviewCard.vue';")
start=s.index("const formatAnswer = (answer: string | string[]) =>")
end=s.index("const gradeScoreValue = (grade: QuestionGrade) =>", start)
s=s[:start]+s[end:]
old="""const updateScore = (questionId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const inputScore = Number(target.value);
  const grade = questionGrades.value.find((item) => item.questionId === questionId);
  const safeScore = Math.max(0, Math.min(grade?.maxScore ?? Number.MAX_SAFE_INTEGER, inputScore));

  scoreOverrides.value = { ...scoreOverrides.value, [questionId]: safeScore };
  questionGrades.value = questionGrades.value.map((item) =>
    item.questionId === questionId ? { ...item, finalScore: safeScore } : item,
  );
};"""
new="""const updateScore = (questionId: string, inputScore: number) => {
  const grade = questionGrades.value.find((item) => item.questionId === questionId);
  const safeScore = Math.max(0, Math.min(grade?.maxScore ?? Number.MAX_SAFE_INTEGER, inputScore));

  scoreOverrides.value = { ...scoreOverrides.value, [questionId]: safeScore };
  questionGrades.value = questionGrades.value.map((item) =>
    item.questionId === questionId ? { ...item, finalScore: safeScore } : item,
  );
};"""
s=s.replace(old,new)
start=s.index('''          <article
            v-for="grade in pagedQuestionGrades"''')
end=s.index('''          <EnterprisePagination
            v-if="questionTotal > questionPagination.pageSize"''', start)
newblock='''          <GradingQuestionReviewCard
            v-for="grade in pagedQuestionGrades"
            :key="grade.questionId"
            :grade="grade"
            :score="scoreValue(selectedTask, grade.questionId)"
            :disabled="reviewing || selectedTask.status === 'REVIEWED'"
            @update-score="updateScore"
          />
'''
s=s[:start]+newblock+s[end:]
p.write_text(s,encoding='utf-8',newline='\n')
