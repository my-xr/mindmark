from pathlib import Path
import re
for p in Path('apps/mindmark-web/src/views/teacher').glob('*.vue'):
 s=p.read_text(encoding='utf-8')
 if '<PageHeader' in s:
  s2=re.sub(r'\n    <PageHeader[\s\S]*?</PageHeader>\n', '\n', s, count=1)
  s2=s2.replace("import PageHeader from '@/components/common/PageHeader.vue';\n", '')
  p.write_text(s2, encoding='utf-8')
