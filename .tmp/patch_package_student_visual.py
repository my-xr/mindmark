import json
from pathlib import Path
p=Path('package.json')
data=json.loads(p.read_text(encoding='utf-8'))
scripts=data.setdefault('scripts',{})
scripts['web:e2e:student-visual']='pnpm --filter mindmark-web exec playwright test e2e/student-taking-visual.spec.ts --project=teacher-chrome --reporter=line'
p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding='utf-8')
