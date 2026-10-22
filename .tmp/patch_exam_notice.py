from pathlib import Path
p = Path('apps/mindmark-web/src/views/student/ExamNoticeView.vue')
s = p.read_text(encoding='utf-8')
old = '''      <RouterLink v-if="canEnter" class="primary-button" :to="`/student/exams/${exam.id}/take`"
        >进入答题</RouterLink
      >'''
new = '''      <AppActionButton
        v-if="canEnter"
        variant="primary"
        :to="`/student/exams/${exam.id}/take`"
      >
        进入答题
      </AppActionButton>'''
if old not in s:
    print('missing')
else:
    s = s.replace(old, new)
    p.write_text(s, encoding='utf-8')
