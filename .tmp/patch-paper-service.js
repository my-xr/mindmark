const fs=require('fs');
const p='apps/mindmark-web/src/types/paper.ts';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('export interface CreatePaperRequest')){
  s=s.replace('export interface Paper {', `export interface CreatePaperRequest {\n  title: string;\n  courseId: string;\n  description?: string | null;\n  durationMinutes: number;\n}\n\nexport interface Paper {`);
}
fs.writeFileSync(p,s,'utf8');

const ps='apps/mindmark-web/src/services/paperService.ts';
let t=fs.readFileSync(ps,'utf8');
t=t.replace('  Paper,\n', '  CreatePaperRequest,\n  Paper,\n');
if(!t.includes('export async function createPaper(')){
  const fn=`\nexport async function createPaper(request: CreatePaperRequest): Promise<Paper> {\n  if (!useMockApi) {\n    return normalizePaper(await apiPost<Paper, CreatePaperRequest>('/v1/papers', request));\n  }\n\n  const created: Paper = {\n    id: \`paper-mock-\${Date.now()}\`,\n    title: request.title.trim(),\n    courseId: request.courseId,\n    courseName: request.courseId,\n    description: request.description?.trim() ?? '',\n    durationMinutes: Number(request.durationMinutes) || 90,\n    totalScore: 0,\n    status: 'DRAFT',\n    questions: [],\n    createdBy: 'current-teacher',\n    updatedAt: nowText(),\n  };\n  papers = [created, ...papers];\n  return mockDelay(clonePaper(created));\n}\n`;
  t=t.replace('\nexport async function listPapers(): Promise<Paper[]> {', fn+'\nexport async function listPapers(): Promise<Paper[]> {');
}
fs.writeFileSync(ps,t,'utf8');
