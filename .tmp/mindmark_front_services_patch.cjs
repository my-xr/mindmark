const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')}
function write(p,s){fs.writeFileSync(p,s,'utf8')}
let p,s;

p='apps/mindmark-web/src/services/examService.ts';
s=read(p);
if(!s.includes('type PageResponse')){
  s=s.replace("import { apiGet, apiPost, apiPut, useMockApi } from '@/services/api/httpClient';", "import { apiGet, apiPost, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';");
}
s=s.replace(`export async function listExams(): Promise<Exam[]> {
  if (!useMockApi) {
    const responses = await apiGet<ExamResponse[]>('/v1/exams');

    return Promise.all(responses.map(toExam));
  }

  return mockDelay(exams.map(cloneExam));
}`, `export async function listExams(): Promise<Exam[]> {
  if (!useMockApi) {
    const page = await apiGet<PageResponse<ExamResponse>>('/v1/exams', { page: 1, pageSize: 100 });

    return Promise.all(page.items.map(toExam));
  }

  return mockDelay(exams.map(cloneExam));
}`);
write(p,s);

p='apps/mindmark-web/src/services/examSecurityAuditService.ts';
s=read(p);
if(!s.includes('type PageResponse')){
  s=s.replace("import { apiGet, apiPost, useMockApi } from '@/services/api/httpClient';", "import { apiGet, apiPost, type PageResponse, useMockApi } from '@/services/api/httpClient';");
}
s=s.replace(`export async function listExamSecurityEvents(examId: string): Promise<ExamSecurityEvent[]> {
  if (!useMockApi) {
    return apiGet<ExamSecurityEvent[]>(\`/v1/exams/${examId}/security-events\`);
  }
`, `export async function listExamSecurityEvents(examId: string): Promise<ExamSecurityEvent[]> {
  if (!useMockApi) {
    const page = await apiGet<PageResponse<ExamSecurityEvent>>(\`/v1/exams/${examId}/security-events\`, {
      page: 1,
      pageSize: 100,
    });

    return page.items;
  }
`);
write(p,s);

p='apps/mindmark-web/src/services/reviewService.ts';
s=read(p);
if(!s.includes('type PageResponse')){
  s=s.replace("import { apiDownloadBlob, apiGet, apiPost, useMockApi } from '@/services/api/httpClient';", "import { apiDownloadBlob, apiGet, apiPost, type PageResponse, useMockApi } from '@/services/api/httpClient';");
}
s=s.replace(`export async function listExamReviewReports(): Promise<ExamReviewReport[]> {
  if (!useMockApi) {
    return apiGet<ExamReviewReport[]>('/v1/exams/reviews');
  }
`, `export async function listExamReviewReports(): Promise<ExamReviewReport[]> {
  if (!useMockApi) {
    const page = await apiGet<PageResponse<ExamReviewReport>>('/v1/exams/reviews', {
      page: 1,
      pageSize: 100,
    });

    return page.items;
  }
`);
write(p,s);
