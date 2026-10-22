const fs = require('fs');
function w(p,s){fs.writeFileSync(p,s.replace(/^\uFEFF/,''),'utf8')}
let p='apps/mindmark-web/src/types/grading.ts';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('export type GradingAiJobStatus')){
  s=s.replace("export type GradingTaskStatus = 'PENDING' | 'AI_GRADED' | 'REVIEWED';\n", "export type GradingTaskStatus = 'PENDING' | 'AI_GRADED' | 'REVIEWED';\n\nexport type GradingAiJobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'SKIPPED' | 'FAILED';\n");
}
if(!s.includes('export interface GradingAiJob')){
  s=s.replace('export interface GradingTask {\n', `export interface GradingAiJob {\n  id: string;\n  gradingTaskId: string;\n  status: GradingAiJobStatus;\n  teacherId: string;\n  provider?: string | null;\n  model?: string | null;\n  subjectiveItemCount: number;\n  processedItemCount: number;\n  refreshedItemCount: number;\n  errorMessage?: string | null;\n  createdAt: string;\n  startedAt?: string | null;\n  finishedAt?: string | null;\n  updatedAt: string;\n}\n\nexport interface GradingTask {\n`);
}
w(p,s);

p='apps/mindmark-web/src/services/gradingService.ts';
s=fs.readFileSync(p,'utf8');
s=s.replace('  ExamScoreSummary,\n', '  ExamScoreSummary,\n  GradingAiJob,\n');
if(!s.includes('interface BackendGradingAiJob')){
  s=s.replace('interface BackendBatchGradingTaskOperationResponse {\n', `interface BackendGradingAiJob {\n  id: string;\n  gradingTaskId: string;\n  status: GradingAiJob['status'];\n  teacherId: string;\n  provider?: string | null;\n  model?: string | null;\n  subjectiveItemCount: number;\n  processedItemCount: number;\n  refreshedItemCount: number;\n  errorMessage?: string | null;\n  createdAt: string;\n  startedAt?: string | null;\n  finishedAt?: string | null;\n  updatedAt: string;\n}\n\ninterface BackendBatchGradingTaskOperationResponse {\n`);
}
if(!s.includes('const toGradingAiJob')){
  s=s.replace('const mapBackendTaskStatus = (status: string) =>\n  (status === \'AI_CHECKED\' ? \'AI_GRADED\' : status) as GradingTask[\'status\'];\n', `const mapBackendTaskStatus = (status: string) =>\n  (status === 'AI_CHECKED' ? 'AI_GRADED' : status) as GradingTask['status'];\n\nconst toGradingAiJob = (job: BackendGradingAiJob | null | undefined): GradingAiJob | null =>\n  job\n    ? {\n        id: job.id,\n        gradingTaskId: job.gradingTaskId,\n        status: job.status,\n        teacherId: job.teacherId,\n        provider: job.provider,\n        model: job.model,\n        subjectiveItemCount: job.subjectiveItemCount,\n        processedItemCount: job.processedItemCount,\n        refreshedItemCount: job.refreshedItemCount,\n        errorMessage: job.errorMessage,\n        createdAt: job.createdAt,\n        startedAt: job.startedAt,\n        finishedAt: job.finishedAt,\n        updatedAt: job.updatedAt,\n      }\n    : null;\n`);
}
if(!s.includes('export async function enqueueAiGradingJob')){
  s=s.replace('export async function confirmSystemScore(\n', `export async function enqueueAiGradingJob(taskId: string): Promise<GradingAiJob | null> {\n  if (!useMockApi) {\n    const response = await apiPost<BackendGradingAiJob | null, Record<string, never>>(\n      \`/v1/grading-tasks/\${taskId}/ai-grading-job\`,\n      {},\n    );\n    return toGradingAiJob(response);\n  }\n\n  return mockDelay({\n    id: \`MOCK-GAJ-\${taskId}\`,\n    gradingTaskId: taskId,\n    status: 'SUCCEEDED',\n    teacherId: 'teacher-current',\n    provider: 'MOCK',\n    model: 'mock-grader',\n    subjectiveItemCount: 0,\n    processedItemCount: 0,\n    refreshedItemCount: 0,\n    createdAt: nowText(),\n    updatedAt: nowText(),\n  });\n}\n\nexport async function getLatestAiGradingJob(taskId: string): Promise<GradingAiJob | null> {\n  if (!useMockApi) {\n    const response = await apiGet<BackendGradingAiJob | null>(\n      \`/v1/grading-tasks/\${taskId}/ai-grading-job/latest\`,\n    );\n    return toGradingAiJob(response);\n  }\n\n  return mockDelay(null);\n}\n\nexport async function confirmSystemScore(\n`);
}
w(p,s);
