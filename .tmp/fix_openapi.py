from pathlib import Path
p = Path('apps/mindmark-server/openapi/mindmark-api.yaml')
text = p.read_text(encoding='utf-8-sig')
text = text.replace('            data: { type: boolean }    LoginRequest:', '            data: { type: boolean }\n    LoginRequest:')
p.write_text(text, encoding='utf-8')
