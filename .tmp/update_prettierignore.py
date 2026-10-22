from pathlib import Path
p=Path('apps/mindmark-web/.prettierignore')
s=p.read_text(encoding='utf-8-sig').replace('\r\n','\n')
for line in ['test-results', 'playwright-report']:
    if line not in s.splitlines():
        s += ('\n' if not s.endswith('\n') else '') + line + '\n'
p.write_text(s, encoding='utf-8')
