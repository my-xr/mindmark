from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
repls = {
    '<div class="question-edit-hero__icon">✦</div>': '<div class="question-edit-hero__icon">🧾</div>',
    "isCreatingQuestion ? 'NEW QUESTION' : 'EDIT QUESTION'": "isCreatingQuestion ? '题目入库' : '题目维护'",
    "isCreatingQuestion ? '创建可直接入库的题目' : '在题目详情中精修内容'": "isCreatingQuestion ? '创建标准化题目资源' : '维护题目内容与答案解析'",
    '按基础属性、题目内容、选项与评分点分区编辑，保存前自动按结构化字段提交，降低乱码和格式丢失风险。': '统一维护题干、选项、答案解析与评分点，保存后同步更新题库与组卷资源。',
}
for old, new in repls.items():
    if old not in text:
        raise SystemExit(f'not found: {old}')
    text = text.replace(old, new, 1)
old = '''              <button class="secondary-button compact-button" type="button" @click="addOption">
                ＋ 新增选项
              </button>'''
new = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--add"
                type="button"
                aria-label="新增选项"
                title="新增选项"
                @click="addOption"
              >
                <span class="tag-action-button__tag">＋选项</span>
              </button>'''
if old not in text:
    raise SystemExit('add option button not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button danger-button"
                type="button"
                @click="removeOption(index)"
              >
                删除
              </button>'''
new = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--danger"
                type="button"
                aria-label="删除选项"
                title="删除选项"
                @click="removeOption(index)"
              >
                <span class="tag-action-button__tag">🗑</span>
              </button>'''
if old not in text:
    raise SystemExit('remove option button not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button"
                type="button"
                @click="addScoringPoint"
              >
                ＋ 新增评分点
              </button>'''
new = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--add"
                type="button"
                aria-label="新增评分点"
                title="新增评分点"
                @click="addScoringPoint"
              >
                <span class="tag-action-button__tag">＋评分点</span>
              </button>'''
if old not in text:
    raise SystemExit('add scoring point button not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button danger-button"
                type="button"
                @click="removeScoringPoint(index)"
              >
                删除
              </button>'''
new = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--danger"
                type="button"
                aria-label="删除评分点"
                title="删除评分点"
                @click="removeScoringPoint(index)"
              >
                <span class="tag-action-button__tag">🗑</span>
              </button>'''
if old not in text:
    raise SystemExit('remove scoring button not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
