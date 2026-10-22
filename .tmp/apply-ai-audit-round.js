const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}
function replace(file, search, replacement) {
  const text = read(file);
  if (!text.includes(search)) {
    throw new Error(`Pattern not found in ${file}: ${search.slice(0, 120)}`);
  }
  write(file, text.replace(search, replacement));
}
function replaceAll(file, search, replacement) {
  const text = read(file);
  if (!text.includes(search)) {
    throw new Error(`Pattern not found in ${file}: ${search}`);
  }
  write(file, text.split(search).join(replacement));
}

replace(
  'apps/mindmark-web/src/types/question.ts',
  "export type QuestionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED';",
  "export type QuestionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED' | 'REJECTED';",
);

replace(
  'apps/mindmark-web/src/constants/status.ts',
  "  DISABLED: { label: '已停用', tone: 'danger' },\n};",
  "  DISABLED: { label: '已停用', tone: 'danger' },\n  REJECTED: { label: '已驳回', tone: 'danger' },\n};",
);

let aiService = read('apps/mindmark-web/src/services/aiQuestionService.ts');
aiService = aiService.replace(
  `  updatedAt: string;\n  createdBy: string;\n}`,
  `  updatedAt: string;\n  createdBy: string;\n  source?: string;\n  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED' | 'REJECTED';\n  reviewedBy?: string | null;\n  reviewedAt?: string | null;\n  reviewComment?: string | null;\n  reviewAction?: AiReviewStatus | null;\n}`,
);
aiService = aiService.replace(
  `const toAiDraft = (question: ServerQuestionResponse): AiQuestionDraft => ({`,
  `const toReviewStatus = (question: ServerQuestionResponse): AiReviewStatus => {\n  if (question.reviewAction === 'EDITED_ACCEPTED') {\n    return 'EDITED_ACCEPTED';\n  }\n  if (question.reviewAction === 'ACCEPTED' || question.status === 'ACTIVE') {\n    return 'ACCEPTED';\n  }\n  if (question.reviewAction === 'REJECTED' || question.status === 'REJECTED') {\n    return 'REJECTED';\n  }\n\n  return 'PENDING';\n};\n\nconst toAiDraft = (question: ServerQuestionResponse): AiQuestionDraft => ({`,
);
aiService = aiService.replace(
  `  reviewStatus: 'PENDING',`,
  `  reviewStatus: toReviewStatus(question),`,
);
aiService = aiService.replace(
  `  if (!useMockApi) {\n    const generated = await apiPost<ServerQuestionResponse[], ServerAiQuestionGenerateRequest>(\n      '/v1/ai/questions/generate',\n      toServerGenerateRequest(request),\n    );\n    return generated.map(toAiDraft);\n  }`,
  `  if (!useMockApi) {\n    await apiPost<ServerQuestionResponse[], ServerAiQuestionGenerateRequest>(\n      '/v1/ai/questions/generate',\n      toServerGenerateRequest(request),\n    );\n\n    return listAiQuestionDrafts();\n  }`,
);
aiService = aiService.replace(
  `  if (!useMockApi) {\n    return listAiQuestionDrafts();\n  }`,
  `  if (!useMockApi) {\n    if (status === 'PENDING') {\n      return listAiQuestionDrafts();\n    }\n\n    await apiPost<ServerQuestionResponse, { action: Exclude<AiReviewStatus, 'PENDING'> }>(\n      \`/v1/questions/\${id}/review\`,\n      { action: status },\n    );\n\n    return listAiQuestionDrafts();\n  }`,
);
write('apps/mindmark-web/src/services/aiQuestionService.ts', aiService);

let aiView = read('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue');
aiView = aiView.replace(
  `    drafts.value = await generateAiQuestions({ ...form, count: Number(form.count) });`,
  `    await generateAiQuestions({ ...form, count: Number(form.count) });\n    await loadDrafts();`,
);
aiView = aiView.replace(
  `    drafts.value = await reviewAiQuestion(draft.id, status);`,
  `    await reviewAiQuestion(draft.id, status);\n    await loadDrafts();`,
);
aiView = aiView.split(`:disabled="!useMockApi || !canReview(draft) || reviewingId === draft.id"`).join(`:disabled="!canReview(draft) || reviewingId === draft.id"`);
write('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue', aiView);

write('apps/mindmark-web/src/types/audit.ts', `export type ExamSecurityEventType =\n  | 'VISIBILITY_HIDDEN'\n  | 'WINDOW_BLUR'\n  | 'FULLSCREEN_EXIT'\n  | 'AUTO_SUBMIT'\n  | 'MANUAL_REPORT';\n\nexport type ExamSecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH';\n\nexport interface ExamSecurityEventReportRequest {\n  eventType: ExamSecurityEventType;\n  message?: string;\n  clientEventCount?: number;\n  clientOccurredAt?: string;\n}\n\nexport interface ExamSecurityEvent {\n  id: string;\n  examId: string;\n  answerSheetId?: string | null;\n  studentId: string;\n  studentName: string;\n  eventType: ExamSecurityEventType;\n  severity: ExamSecuritySeverity;\n  message?: string | null;\n  clientEventCount: number;\n  clientOccurredAt?: string | null;\n  serverReceivedAt: string;\n  userAgent?: string | null;\n}\n`);

write('apps/mindmark-web/src/services/examSecurityAuditService.ts', `import { apiGet, apiPost, useMockApi } from '@/services/api/httpClient';\nimport type {\n  ExamSecurityEvent,\n  ExamSecurityEventReportRequest,\n  ExamSecurityEventSeverity,\n} from '@/types/audit';\nimport type { ExamSecurityEventType, ExamSecuritySeverity } from '@/types/audit';\n\nconst mockDelay = <T>(data: T, timeout = 180) =>\n  new Promise<T>((resolve) => {\n    window.setTimeout(() => resolve(data), timeout);\n  });\n\nconst nowText = () => new Date().toISOString();\n\nconst severityByType: Record<ExamSecurityEventType, ExamSecuritySeverity> = {\n  VISIBILITY_HIDDEN: 'MEDIUM',\n  WINDOW_BLUR: 'MEDIUM',\n  FULLSCREEN_EXIT: 'MEDIUM',\n  AUTO_SUBMIT: 'HIGH',\n  MANUAL_REPORT: 'LOW',\n};\n\nlet mockEvents: ExamSecurityEvent[] = [\n  {\n    id: 'SE-MOCK-001',\n    examId: 'exam-001',\n    answerSheetId: 'sheet-exam-001-current',\n    studentId: 'student-current',\n    studentName: '20260001',\n    eventType: 'WINDOW_BLUR',\n    severity: 'MEDIUM',\n    message: '窗口失焦/疑似切屏',\n    clientEventCount: 1,\n    clientOccurredAt: nowText(),\n    serverReceivedAt: nowText(),\n    userAgent: 'Mock Browser',\n  },\n];\n\nexport async function listExamSecurityEvents(examId: string): Promise<ExamSecurityEvent[]> {\n  if (!useMockApi) {\n    return apiGet<ExamSecurityEvent[]>(`/v1/exams/${examId}/security-events`);\n  }\n\n  return mockDelay(\n    mockEvents\n      .filter((event) => event.examId === examId)\n      .sort((a, b) => b.serverReceivedAt.localeCompare(a.serverReceivedAt)),\n  );\n}\n\nexport async function reportExamSecurityEvent(\n  examId: string,\n  request: ExamSecurityEventReportRequest,\n): Promise<ExamSecurityEvent> {\n  if (!useMockApi) {\n    return apiPost<ExamSecurityEvent, ExamSecurityEventReportRequest>(\n      `/v1/exams/${examId}/security-events`,\n      request,\n    );\n  }\n\n  const event: ExamSecurityEvent = {\n    id: `SE-MOCK-${Date.now()}`,\n    examId,\n    answerSheetId: `sheet-${examId}-mock`,\n    studentId: 'student-current',\n    studentName: '20260001',\n    eventType: request.eventType,\n    severity: severityByType[request.eventType],\n    message: request.message ?? null,\n    clientEventCount: Math.max(request.clientEventCount ?? 1, 1),\n    clientOccurredAt: request.clientOccurredAt ?? nowText(),\n    serverReceivedAt: nowText(),\n    userAgent: window.navigator.userAgent,\n  };\n  mockEvents = [event, ...mockEvents];\n\n  return mockDelay(event, 120);\n}\n`);

// Fix accidental bad import in new service.
let auditService = read('apps/mindmark-web/src/services/examSecurityAuditService.ts');
auditService = auditService.replace(
  `import type {\n  ExamSecurityEvent,\n  ExamSecurityEventReportRequest,\n  ExamSecurityEventSeverity,\n} from '@/types/audit';\nimport type { ExamSecurityEventType, ExamSecuritySeverity } from '@/types/audit';`,
  `import type {\n  ExamSecurityEvent,\n  ExamSecurityEventReportRequest,\n  ExamSecurityEventSeverity,\n  ExamSecurityEventType,\n} from '@/types/audit';`,
).replace(/,\n  ExamSecurityEventSeverity/g, '');
write('apps/mindmark-web/src/services/examSecurityAuditService.ts', auditService);
