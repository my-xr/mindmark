const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')}
function write(p,s){fs.writeFileSync(p,s,'utf8')}
let p,s;

p='apps/mindmark-web/src/services/examSecurityAuditService.ts';
s=read(p);
if(!s.includes('type PageResponse')){
  s=s.replace("import { apiGet, apiPost, useMockApi } from '@/services/api/httpClient';", "import { apiGet, apiPost, type PageResponse, useMockApi } from '@/services/api/httpClient';");
}
s=s.replace(/export async function listExamSecurityEvents\(examId: string\): Promise<ExamSecurityEvent\[]> \{\r?\n  if \(!useMockApi\) \{\r?\n    return apiGet<ExamSecurityEvent\[]>\(`\/v1\/exams\/\$\{examId\}\/security-events`\);\r?\n  \}\r?\n/, "export async function listExamSecurityEvents(examId: string): Promise<ExamSecurityEvent[]> {\n  if (!useMockApi) {\n    const page = await apiGet<PageResponse<ExamSecurityEvent>>(`/v1/exams/${examId}/security-events`, {\n      page: 1,\n      pageSize: 100,\n    });\n\n    return page.items;\n  }\n");
write(p,s);

p='apps/mindmark-web/src/services/reviewService.ts';
s=read(p);
if(!s.includes('type PageResponse')){
  s=s.replace("import { apiDownloadBlob, apiGet, apiPost, useMockApi } from '@/services/api/httpClient';", "import { apiDownloadBlob, apiGet, apiPost, type PageResponse, useMockApi } from '@/services/api/httpClient';");
}
s=s.replace(/export async function listExamReviewReports\(\): Promise<ExamReviewReport\[]> \{\r?\n  if \(!useMockApi\) \{\r?\n    return apiGet<ExamReviewReport\[]>\('\/v1\/exams\/reviews'\);\r?\n  \}\r?\n/, "export async function listExamReviewReports(): Promise<ExamReviewReport[]> {\n  if (!useMockApi) {\n    const page = await apiGet<PageResponse<ExamReviewReport>>('/v1/exams/reviews', {\n      page: 1,\n      pageSize: 100,\n    });\n\n    return page.items;\n  }\n");
write(p,s);
