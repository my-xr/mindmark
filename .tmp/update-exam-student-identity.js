const fs = require('fs');
let p = 'apps/mindmark-web/src/types/exam.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(`export interface ExamCreateRequest {
  title: string;
  paperId: string;
  classNames: string[];
  startTime: string;
  endTime: string;
}`, `export interface ExamCreateRequest {
  title: string;
  paperId: string;
  classIds: string[];
  classNames?: string[];
  startTime: string;
  endTime: string;
}`);
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-web/src/services/examService.ts';
s = fs.readFileSync(p, 'utf8');
s = s.replace("const REAL_STUDENT_ID = import.meta.env.VITE_AUTH_STUDENT_ID || 'student-001';\n", '');
s = s.replace(
  "      `Current student has no answer sheet for this exam. Please ensure the exam includes ${REAL_STUDENT_ID}.`,",
  "      'Current student has no answer sheet for this exam. Please ensure the exam includes the logged-in student class.',",
);
s = s.replace('      classIds: request.classNames.length > 0 ? request.classNames : [\'class-frontend-1\'],', '      classIds: request.classIds,');
s = s.replace('    classNames: request.classNames,', "    classNames: request.classNames ?? request.classIds,");
s = s.replace('    participantCount: request.classNames.length * 42,', '    participantCount: Math.max(1, request.classIds.length) * 42,');
s = s.replace(`    const responses = await apiGet<StudentExamResponse[]>('/v1/student/exams', {
      studentId: REAL_STUDENT_ID,
    });`, `    const responses = await apiGet<StudentExamResponse[]>('/v1/student/exams');`);
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-web/src/services/gradingService.ts';
s = fs.readFileSync(p, 'utf8');
s = s.replace(`    const resolvedStudentId = studentId === 'student-current' ? 'student-001' : studentId;
    const reports = await apiGet<BackendScoreReport[]>('/v1/student/score-reports', {
      studentId: resolvedStudentId,
    });`, `    const reports = await apiGet<BackendScoreReport[]>('/v1/student/score-reports');`);
fs.writeFileSync(p, s, 'utf8');
