from pathlib import Path
p=Path('.gitignore')
s=p.read_text(encoding='utf-8-sig')
add='''
# Test artifacts
apps/*/test-results/
apps/*/playwright-report/
'''
if 'apps/*/test-results/' not in s:
    if not s.endswith('\n'):
        s += '\n'
    s += add
p.write_text(s, encoding='utf-8')
