from pathlib import Path
p=Path('apps/mindmark-web/eslint.config.js')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("ignores: ['dist/**', 'coverage/**', 'node_modules/**'],", "ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],")
p.write_text(s, encoding='utf-8')
