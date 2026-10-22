from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
needle = """const questionDrawerTitle = computed(() => {\n  if (isEditorMode.value) {\n    return isCreatingQuestion.value ? '新增题目' : '编辑题目';\n  }\n\n  return '题目详情';\n});\n"""
insert = """const questionDrawerTitle = computed(() => {\n  if (isEditorMode.value) {\n    return isCreatingQuestion.value ? '新增题目' : '编辑题目';\n  }\n\n  return '题目详情';\n});\nconst editingCourseName = computed(() => {\n  return courses.value.find((course) => course.id === editForm.courseId)?.name ?? '未选择课程';\n});\nconst editingTypeLabel = computed(() => QUESTION_TYPE_META[editForm.type]?.label ?? editForm.type);\nconst editingDifficultyLabel = computed(\n  () => DIFFICULTY_META[editForm.difficulty]?.label ?? editForm.difficulty,\n);\n"""
if needle not in text:
    raise SystemExit('drawer title needle not found')
text = text.replace(needle, insert, 1)
old = """      <div v-else class=\"question-edit-stack\">\n        <div class=\"question-edit-hint\">\n          <strong>{{\n            isCreatingQuestion ? '创建可直接入库的题目' : '在详情上下文中编辑题目'\n          }}</strong>\n          <span>结构化编辑选项、答案与评分点，避免手写 JSON 和乱码风险。</span>\n        </div>\n\n        <div class=\"question-edit-sections\">\n"""
new = """      <div v-else class=\"question-edit-stack\">\n        <div class=\"question-edit-hero\">\n          <div class=\"question-edit-hero__icon\">✦</div>\n          <div class=\"question-edit-hero__content\">\n            <span class=\"question-edit-hero__eyebrow\">{{\n              isCreatingQuestion ? 'NEW QUESTION' : 'EDIT QUESTION'\n            }}</span>\n            <strong>{{ isCreatingQuestion ? '创建可直接入库的题目' : '在题目详情中精修内容' }}</strong>\n            <p>\n              按基础属性、题目内容、选项与评分点分区编辑，保存前自动按结构化字段提交，降低乱码和格式丢失风险。\n            </p>\n          </div>\n          <div class=\"question-edit-hero__meta\" aria-label=\"当前编辑摘要\">\n            <span>{{ editingCourseName }}</span>\n            <span>{{ editingTypeLabel }}</span>\n            <span>{{ editingDifficultyLabel }}</span>\n          </div>\n        </div>\n\n        <div class=\"question-edit-sections\">\n"""
if old not in text:
    raise SystemExit('hint block not found')
text = text.replace(old, new, 1)
repls = {
"""            <div class=\"question-edit-section__head\">\n              <strong>基础属性</strong>\n              <span>决定题目归属、类型、难度和默认分值。</span>\n            </div>\n""": """            <div class=\"question-edit-section__head\">\n              <span class=\"question-edit-section__index\">01</span>\n              <div>\n                <strong>基础属性</strong>\n                <span>决定题目归属、类型、难度和默认分值。</span>\n              </div>\n            </div>\n""",
"""            <div class=\"question-edit-section__head\">\n              <strong>题目内容</strong>\n              <span>题干、知识点、参考答案和解析均以结构化字段保存。</span>\n            </div>\n""": """            <div class=\"question-edit-section__head\">\n              <span class=\"question-edit-section__index\">02</span>\n              <div>\n                <strong>题目内容</strong>\n                <span>题干、知识点、参考答案和解析均以结构化字段保存。</span>\n              </div>\n            </div>\n""",
"""              <div class=\"question-edit-section__head\">\n                <strong>选项</strong>\n                <span>客观题建议保持 2-6 个选项，主观题可留空。</span>\n              </div>\n""": """              <div class=\"question-edit-section__head\">\n                <span class=\"question-edit-section__index\">03</span>\n                <div>\n                  <strong>选项</strong>\n                  <span>客观题建议保持 2-6 个选项，主观题可留空。</span>\n                </div>\n              </div>\n""",
"""              <div class=\"question-edit-section__head\">\n                <strong>评分点</strong>\n                <span>主观题可配置关键词和必需项，客观题可留空。</span>\n              </div>\n""": """              <div class=\"question-edit-section__head\">\n                <span class=\"question-edit-section__index\">04</span>\n                <div>\n                  <strong>评分点</strong>\n                  <span>主观题可配置关键词和必需项，客观题可留空。</span>\n                </div>\n              </div>\n""",
}
for old, new in repls.items():
    if old not in text:
        raise SystemExit('section head not found')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
