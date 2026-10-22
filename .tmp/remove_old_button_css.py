from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
start = text.index('.question-detail-actions {')
end = text.index('.question-edit-stack,', start)
text = text[:start] + ".question-detail-actions {\n  align-items: center;\n}\n\n" + text[end:]
start = text.index('.question-drawer-actions .secondary-button,')
end = text.index('.structured-editor {', start)
text = text[:start] + ".question-editor-actions,\n.question-compose-actions {\n  align-items: center;\n  gap: 18px;\n}\n\n" + text[end:]
start = text.index('.tag-action-button {')
end = text.index('.loading-text {', start)
text = text[:start] + text[end:]
path.write_text(text, encoding='utf-8')
