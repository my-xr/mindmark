import { apiGet, apiPost, type PageResponse, useMockApi } from '@/services/api/httpClient';
import type {
  ExamSecurityEvent,
  ExamSecurityEventReportRequest,
  ExamSecurityEventType,
  ExamSecuritySeverity,
} from '@/types/audit';

const mockDelay = <T>(data: T, timeout = 180) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

const nowText = () => new Date().toISOString();

const severityByType: Record<ExamSecurityEventType, ExamSecuritySeverity> = {
  VISIBILITY_HIDDEN: 'MEDIUM',
  WINDOW_BLUR: 'MEDIUM',
  FULLSCREEN_EXIT: 'MEDIUM',
  AUTO_SUBMIT: 'HIGH',
  MANUAL_REPORT: 'LOW',
};

let mockEvents: ExamSecurityEvent[] = [
  {
    id: 'SE-MOCK-001',
    examId: 'exam-001',
    answerSheetId: 'sheet-exam-001-current',
    studentId: 'student-current',
    studentName: '20260001',
    eventType: 'WINDOW_BLUR',
    severity: 'MEDIUM',
    message: '窗口失焦/疑似切屏',
    clientEventCount: 1,
    clientOccurredAt: nowText(),
    serverReceivedAt: nowText(),
    userAgent: 'Mock Browser',
  },
];

export async function listExamSecurityEvents(examId: string): Promise<ExamSecurityEvent[]> {
  const page = await listExamSecurityEventsPage(examId, 1, 100);

  return page.items;
}

export async function listExamSecurityEventsPage(
  examId: string,
  page = 1,
  pageSize = 10,
): Promise<PageResponse<ExamSecurityEvent>> {
  if (!useMockApi) {
    return apiGet<PageResponse<ExamSecurityEvent>>(`/v1/exams/${examId}/security-events`, {
      page,
      pageSize,
    });
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
  const filtered = mockEvents
    .filter((event) => event.examId === examId)
    .sort((a, b) => b.serverReceivedAt.localeCompare(a.serverReceivedAt));
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: filtered.slice(start, start + safePageSize),
    total: filtered.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function reportExamSecurityEvent(
  examId: string,
  request: ExamSecurityEventReportRequest,
): Promise<ExamSecurityEvent> {
  if (!useMockApi) {
    return apiPost<ExamSecurityEvent, ExamSecurityEventReportRequest>(
      `/v1/exams/${examId}/security-events`,
      request,
    );
  }

  const event: ExamSecurityEvent = {
    id: `SE-MOCK-${Date.now()}`,
    examId,
    answerSheetId: `sheet-${examId}-mock`,
    studentId: 'student-current',
    studentName: '20260001',
    eventType: request.eventType,
    severity: severityByType[request.eventType],
    message: request.message ?? null,
    clientEventCount: Math.max(request.clientEventCount ?? 1, 1),
    clientOccurredAt: request.clientOccurredAt ?? nowText(),
    serverReceivedAt: nowText(),
    userAgent: window.navigator.userAgent,
  };
  mockEvents = [event, ...mockEvents];

  return mockDelay(event, 120);
}
