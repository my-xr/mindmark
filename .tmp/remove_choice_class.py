from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''              <AppChoiceChips
                class="compose-difficulty-list"
                label="难度范围"''', '''              <AppChoiceChips
                label="难度范围"''')
p.write_text(s, encoding='utf-8')
