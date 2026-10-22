import {
  apiClient,
  apiGet,
  apiPost,
  type PageResponse,
  useMockApi,
} from '@/services/api/httpClient';
import type { UserStatus } from '@/types/user';

export interface StudentImportRow {
  studentNo: string;
  name: string;
  email?: string | null;
  className?: string | null;
  grade?: string | null | undefined;
  major?: string | null | undefined;
}

export interface StudentAccount {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  studentNo: string;
  classId: string;
  className: string;
  grade?: string | null | undefined;
  major?: string | null | undefined;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface RosterImportError {
  rowNumber: number;
  studentNo?: string | null;
  message: string;
}

export interface RosterImportResult {
  taskId: string;
  status: 'SUCCEEDED' | 'PARTIAL_FAILED' | 'FAILED';
  totalCount: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errors: RosterImportError[];
  students: StudentAccount[];
}

export interface ResetPasswordResult {
  studentId: string;
  username: string;
  mustChangePassword: boolean;
}

const mockStudents: StudentAccount[] = [
  {
    id: 'student-001',
    userId: 'u-student-001',
    username: '202601345678',
    name: 'MindMark Demo Student',
    email: 'student001@mindmark.local',
    studentNo: '202601345678',
    classId: 'class-demo-001',
    className: '软件工程 1 班',
    grade: '2026',
    major: '软件工程',
    status: 'ACTIVE',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  },
];

export async function downloadStudentRosterTemplate() {
  if (useMockApi) {
    const blob = new Blob(
      [
        'studentNo,name,email,className,grade,major\n202601234567,张三,zhangsan@example.com,软件工程 1 班,2026,软件工程\n',
      ],
      { type: 'text/csv;charset=utf-8' },
    );
    triggerDownload(blob, 'mindmark-student-roster-template.csv');
    return;
  }

  const response = await apiClient.get('/v1/student-roster-template', { responseType: 'blob' });
  triggerDownload(response.data as Blob, 'mindmark-student-roster-template.csv');
}

export async function importStudents(
  classId: string,
  className: string,
  students: StudentImportRow[],
): Promise<RosterImportResult> {
  if (useMockApi) {
    return Promise.resolve({
      taskId: 'mock-roster-import',
      status: 'SUCCEEDED',
      totalCount: students.length,
      createdCount: students.length,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      students: students.map((student, index) => ({
        id: `mock-student-${index + 1}`,
        userId: `mock-user-${index + 1}`,
        username: student.studentNo,
        name: student.name,
        email: student.email || `${student.studentNo}@student.mindmark.local`,
        studentNo: student.studentNo,
        classId,
        className,
        grade: student.grade ?? null,
        major: student.major ?? null,
        status: 'ACTIVE',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      })),
    });
  }

  return apiPost<
    RosterImportResult,
    { classId: string; className: string; students: StudentImportRow[] }
  >(`/v1/classes/${classId}/students/import`, { classId, className, students });
}

export async function listClassStudentsPage(
  classId: string,
  page = 1,
  pageSize = 20,
): Promise<PageResponse<StudentAccount>> {
  if (useMockApi) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    const filtered = mockStudents.filter((student) => student.classId === classId);
    const start = (safePage - 1) * safePageSize;

    return Promise.resolve({
      items: filtered.slice(start, start + safePageSize),
      total: filtered.length,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / safePageSize)),
      hasPrevious: safePage > 1,
      hasNext: safePage * safePageSize < filtered.length,
    });
  }

  return apiGet<PageResponse<StudentAccount>>(`/v1/classes/${classId}/students`, {
    page,
    pageSize,
  });
}

export async function listClassStudents(classId: string): Promise<StudentAccount[]> {
  const response = await listClassStudentsPage(classId, 1, 100);
  return response.items;
}

export async function resetStudentPassword(studentId: string): Promise<ResetPasswordResult> {
  if (useMockApi) {
    return Promise.resolve({ studentId, username: 'mock-student', mustChangePassword: true });
  }

  return apiPost<ResetPasswordResult>(`/v1/students/${studentId}/reset-password`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
