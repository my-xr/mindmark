from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
lines=p.read_text(encoding='utf-8').splitlines()
# replace actions block lines by markers
start=next(i for i,l in enumerate(lines) if '<span class="inline-actions">' in l)
end=start
while end < len(lines) and '</span>' not in lines[end] or end < start+10:
    end += 1
# better find line after the closing inline-actions span before </button>
end=next(i for i in range(start+1,len(lines)) if lines[i].strip() == '</span>' and lines[i+1].strip() == '</button>')
new_block='''          <span class="inline-actions compact-actions">
            <span
              class="action-link"
              role="button"
              tabindex="0"
              @click.stop="selectQuestion(question)"
              >查看</span
            >
            <span class="action-more" role="button" tabindex="0" @click.stop>
              更多
              <span class="action-popover">
                <span class="action-link" role="button" tabindex="0" @click.stop="openEdit(question)">
                  编辑题目
                </span>
                <span class="action-link" role="button" tabindex="0" @click.stop="openCompose(question)">
                  加入试卷
                </span>
                <span
                  class="action-link action-link--danger"
                  role="button"
                  tabindex="0"
                  @click.stop="confirmDeleteQuestion(question)"
                >
                  {{ deletingQuestionId === question.id ? '删除中' : '删除/停用' }}
                </span>
              </span>
            </span>
          </span>'''.splitlines()
lines=lines[:start]+new_block+lines[end+1:]
p.write_text('\n'.join(lines)+'\n', encoding='utf-8')
