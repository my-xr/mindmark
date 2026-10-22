from pathlib import Path
p = Path('apps/mindmark-web/src/components/common/AppActionButton.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('''  font-family: inherit;
  font-weight: 720;
  letter-spacing: 0.01em;
  line-height: 1;''', '''  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.01em;
  line-height: 1;''')
s = s.replace('''  min-height: 32px;
  gap: 6px;
  padding: 0 12px;
  font-size: 0.8rem;''', '''  min-height: 30px;
  gap: 5px;
  padding: 0 10px;''')
s = s.replace('''  min-height: 36px;
  gap: 7px;
  padding: 0 14px;
  font-size: 0.82rem;''', '''  min-height: 34px;
  gap: 6px;
  padding: 0 12px;''')
s = s.replace('''  width: 18px;
  height: 18px;''', '''  width: 16px;
  height: 16px;''')
s = s.replace('''  min-height: 28px;
  padding: 0 10px;
  font-size: 0.76rem;''', '''  min-height: 26px;
  padding: 0 9px;''')
s = s.replace('''  width: 30px;''', '''  width: 28px;''')
p.write_text(s, encoding='utf-8')

p = Path('apps/mindmark-web/src/styles/visual-alignment.css')
s = p.read_text(encoding='utf-8')
repls = {
    'min-width: 34px;\n  max-width: none;\n  height: auto;\n  min-height: 34px;': 'min-width: 32px;\n  max-width: none;\n  height: auto;\n  min-height: 32px;',
    'padding-inline: 10px;': 'padding-inline: 9px;',
    'width: 18px;\n  flex: 0 0 18px;': 'width: 16px;\n  flex: 0 0 16px;',
    'width: 34px;\n  min-width: 34px;\n  max-width: 34px;\n  height: 34px;\n  min-height: 34px;\n  flex: 0 0 34px;': 'width: 32px;\n  min-width: 32px;\n  max-width: 32px;\n  height: 32px;\n  min-height: 32px;\n  flex: 0 0 32px;',
    'width: max-content;\n  min-width: 34px;': 'width: max-content;\n  min-width: 32px;',
    'height: 34px;': 'height: 32px;',
}
for old, new in repls.items():
    s = s.replace(old, new)
p.write_text(s, encoding='utf-8')
