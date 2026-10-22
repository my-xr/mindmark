import sys
from pathlib import Path
path = Path(sys.argv[1])
sentinel = sys.argv[2]
chunks = []
for line in sys.stdin:
    if line.rstrip('\r\n') == sentinel:
        break
    chunks.append(line)
path.write_text(''.join(chunks), encoding='utf-8')
print(f'wrote {path} ({sum(len(x) for x in chunks)} chars)')
