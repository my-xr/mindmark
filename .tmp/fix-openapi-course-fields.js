const fs = require('fs');
const p = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let s = fs.readFileSync(p, 'utf8');
const qParamFrom = `        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, PENDING_REVIEW, ACTIVE, DISABLED]
        - name: knowledgePoint`;
const qParamTo = `        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, PENDING_REVIEW, ACTIVE, DISABLED]
        - name: courseId
          in: query
          schema:
            type: string
        - name: knowledgePoint`;
if (s.includes(qParamFrom)) s = s.replace(qParamFrom, qParamTo);
const qPropFrom = `        difficulty: { $ref: '#/components/schemas/Difficulty' }
        score: { type: number }`;
const qPropTo = `        difficulty: { $ref: '#/components/schemas/Difficulty' }
        courseId: { type: string, nullable: true }
        courseName: { type: string, nullable: true }
        score: { type: number }`;
if (s.includes(qPropFrom)) s = s.replace(qPropFrom, qPropTo);
fs.writeFileSync(p, s, 'utf8');
