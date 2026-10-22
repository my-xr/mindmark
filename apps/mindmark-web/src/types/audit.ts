export type ExamSecurityEventType =
  'VISIBILITY_HIDDEN' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'AUTO_SUBMIT' | 'MANUAL_REPORT';

export type ExamSecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ExamSecurityEventReportRequest {
  eventType: ExamSecurityEventType;
  message?: string;
  clientEventCount?: number;
  clientOccurredAt?: string;
}

export interface ExamSecurityEvent {
  id: string;
  examId: string;
  answerSheetId?: string | null;
  studentId: string;
  studentName: string;
  eventType: ExamSecurityEventType;
  severity: ExamSecuritySeverity;
  message?: string | null;
  clientEventCount: number;
  clientOccurredAt?: string | null;
  serverReceivedAt: string;
  userAgent?: string | null;
}
