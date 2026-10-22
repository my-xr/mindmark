from pathlib import Path
p=Path('apps/mindmark-web/src/styles/visual-alignment.css')
s=p.read_text(encoding='utf-8')
s=s.replace(".exam-entry-button {\n  width: 100%;\n}", ".exam-card-actions {\n  display: grid;\n  gap: 8px;\n}\n\n.exam-entry-button {\n  width: 100%;\n  justify-content: center;\n}")
p.write_text(s,encoding='utf-8')
