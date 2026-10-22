const fs = require('fs');
const p = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
if (!s.includes('name: excludePaperId')) {
  s = s.replace(`        - name: source
          in: query
          schema:
            type: string
            enum: [MANUAL, AI, IMPORT]
      responses:`, `        - name: source
          in: query
          schema:
            type: string
            enum: [MANUAL, AI, IMPORT]
        - name: excludePaperId
          in: query
          description: Exclude questions already bound to the specified paper. Used by paper assembly available-question pagination.
          schema:
            type: string
      responses:`);
}
fs.writeFileSync(p, s, 'utf8');
