from pathlib import Path
p = Path('scripts/api-smoke/run-ai-question-loop-smoke.ps1')
s = p.read_text(encoding='utf-8')
s = s.replace('$summary = [ordered]@{}\n$runId', 'Assert-True ($Count -ge 2) "Count must be at least 2 because smoke covers accept + reject/edit flows"\n\n$summary = [ordered]@{}\n$runId')
p.write_text(s, encoding='utf-8')
