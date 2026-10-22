const fs=require('fs'); const p='apps/mindmark-server/openapi/mindmark-api.yaml'; let t=fs.readFileSync(p,'utf8');
console.log('has ai before', t.includes('aiConfidence: { type: number, nullable: true }'), 'has pass before', t.includes('passScore: { type: number'));
const idx=t.indexOf('    GradingItem:'); const idx2=t.indexOf('    GradingTask:', idx); const item=t.slice(idx,idx2); console.log(item);
