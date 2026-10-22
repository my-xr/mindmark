const fs = require('fs');
const p = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let s = fs.readFileSync(p, 'utf8');
const before = s;
s = s.replace(
  /(\s+requiredCount: \{ type: integer \}\r?\n\s+availableCount: \{ type: integer \}\r?\n)(\s+message: \{ type: string \})/,
  '$1        knowledgePoints:\n          type: array\n          items: { type: string }\n$2',
);
if (s === before) {
  throw new Error('not replaced');
}
fs.writeFileSync(p, s, 'utf8');
