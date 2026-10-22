const fs=require('fs'); const p='apps/mindmark-server/openapi/mindmark-api.yaml'; let t=fs.readFileSync(p,'utf8');
t=t.replace(/        correct: \{ type: boolean, nullable: true \}\r?\n        comment: \{ type: string, nullable: true \}/, `        correct: { type: boolean, nullable: true }
        aiConfidence: { type: number, nullable: true }
        needsReview: { type: boolean, nullable: true }
        comment: { type: string, nullable: true }`);
t=t.replace(/        finalScore: \{ type: number, nullable: true \}\r?\n        comment: \{ type: string, nullable: true \}/, `        finalScore: { type: number, nullable: true }
        passScore: { type: number }
        passed: { type: boolean, nullable: true }
        failed: { type: boolean, nullable: true }
        needsReview: { type: boolean, nullable: true }
        reviewReason: { type: string, nullable: true }
        comment: { type: string, nullable: true }`);
fs.writeFileSync(p,t,'utf8');
console.log(t.includes('aiConfidence'),t.includes('passScore'));
