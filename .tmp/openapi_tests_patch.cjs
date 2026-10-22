const fs=require('fs');
const p='apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
s=s.replace('.contains("/api/v1/papers/{paperId}/questions:")', '.contains("/api/v1/papers/{paperId}/questions:")\n            .contains("PaperQuestionPageResponse:")');
s=s.replace('.contains("/api/v1/exams/{examId}/scores:")', '.contains("/api/v1/exams/{examId}/security-events:")\n            .contains("ExamSecurityEventPageResponse:")\n            .contains("/api/v1/exams/{examId}/scores:")');
fs.writeFileSync(p,s,'utf8');
