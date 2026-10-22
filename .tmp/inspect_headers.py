from pathlib import Path
import re
for p in sorted(Path('apps/mindmark-web/src/views/teacher').glob('*.vue')):
    s=p.read_text(encoding='utf-8')
    for m in re.finditer(r'<PageHeader([\s\S]*?)(?:/>|>)', s):
        attrs=m.group(1)
        title=re.search(r'title="([^"]*)"', attrs)
        desc=re.search(r'description="([^"]*)"', attrs)
        print('\n---', p.name)
        print('title=', title.group(1) if title else None)
        print('desc=', desc.group(1) if desc else None)
        # actions content next 400 chars after m
        start=m.end()
        print('after=', s[start:start+450].replace('\n',' ')[:450])
