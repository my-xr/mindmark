from pathlib import Path
p = Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('<span>剩余时间</span>', '<span>倒计时</span>')
s = s.replace("<span>{{ fullscreenRequired ? '待进入全屏' : '全屏监考中' }}</span>", "<span>考试监考 · {{ fullscreenRequired ? '待全屏' : '正常' }}</span>")
needle = '''        <details v-if="baseCanEdit" class="exam-guard-details">
'''
insert = '''        <AppActionButton
          v-if="baseCanEdit"
          variant="primary"
          :disabled="!fullscreenRequired"
          @click="requestExamFullscreen"
        >
          {{ fullscreenRequired ? '进入全屏答题' : '已进入全屏' }}
        </AppActionButton>

'''
if needle not in s:
    raise SystemExit('details needle not found')
s = s.replace(needle, insert + needle, 1)
p.write_text(s, encoding='utf-8')
