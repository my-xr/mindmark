const fs=require('fs');
const p='apps/mindmark-server/openapi/mindmark-api.yaml';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('summary: Delete editable paper')){
  const start=s.indexOf('  /api/v1/papers/{paperId}:');
  const end=s.indexOf('  /api/v1/papers/{paperId}/status:', start);
  if(start<0 || end<0) throw new Error('paper path block not found');
  const block=s.slice(start,end);
  const add=`    delete:\r\n      tags: [Paper]\r\n      summary: Delete editable paper\r\n      description: Only ADMIN/TEACHER/TA can delete DRAFT or READY papers that have not created exams. Paper-question relations are removed, original question bank items are preserved.\r\n      parameters:\r\n        - $ref: '#/components/parameters/PaperId'\r\n      responses:\r\n        '200':\r\n          description: Delete result\r\n          content:\r\n            application/json:\r\n              schema:\r\n                $ref: '#/components/schemas/BooleanResponse'\r\n        '409':\r\n          description: Paper is published, archived, or already used by exams\r\n`;
  s=s.slice(0,end)+add+s.slice(end);
}
fs.writeFileSync(p,s,'utf8');
