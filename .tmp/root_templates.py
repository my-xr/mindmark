from pathlib import Path
import re
for d in ['teacher','admin','student']:
    print('---', d)
    for p in sorted(Path(f'apps/mindmark-web/src/views/{d}').glob('*.vue')):
        s=p.read_text(encoding='utf-8-sig')
        m=re.search(r'<template>\s*\n\s*(<[^>]+>)', s)
        print(p.name, '=>', (m.group(1)[:140] if m else 'no'))
