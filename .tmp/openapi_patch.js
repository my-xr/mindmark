const fs=require('fs'); const p='apps/mindmark-server/openapi/mindmark-api.yaml'; let t=fs.readFileSync(p,'utf8');
t=t.replace("                $ref: '#/components/schemas/BatchGradingTaskOperationResponse'  /api/v1/grading-tasks/{gradingTaskId}/review:", "                $ref: '#/components/schemas/BatchGradingTaskOperationResponse'\n  /api/v1/grading-tasks/{gradingTaskId}/review:");
t=t.replace("            data: { $ref: '#/components/schemas/BatchGradingTaskOperation' }    ReviewGradingTaskRequest:", "            data: { $ref: '#/components/schemas/BatchGradingTaskOperation' }\n    ReviewGradingTaskRequest:");
if (!t.includes('aiConfidence: { type: number, nullable: true }')) {
  t=t.replace("        correct: { type: boolean, nullable: true }\n        comment: { type: string, nullable: true }", "        correct: { type: boolean, nullable: true }\n        aiConfidence: { type: number, nullable: true }\n        needsReview: { type: boolean, nullable: true }\n        comment: { type: string, nullable: true }");
}
if (!t.includes('passScore: { type: number')) {
  t=t.replace("        finalScore: { type: number, nullable: true }\n        comment: { type: string, nullable: true }", "        finalScore: { type: number, nullable: true }\n        passScore: { type: number }\n        passed: { type: boolean, nullable: true }\n        failed: { type: boolean, nullable: true }\n        needsReview: { type: boolean, nullable: true }\n        reviewReason: { type: string, nullable: true }\n        comment: { type: string, nullable: true }");
}
fs.writeFileSync(p,t,'utf8');
