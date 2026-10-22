from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
text = p.read_text(encoding='utf-8-sig')
text = text.replace('`r`n', '\n')
p.write_text(text, encoding='utf-8')
