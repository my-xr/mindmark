export type ApiContractDomain =
  | 'auth'
  | 'academic'
  | 'question'
  | 'paper'
  | 'exam'
  | 'answerSheet'
  | 'grading'
  | 'score'
  | 'review'
  | 'ai';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiContractItem {
  id: string;
  domain: ApiContractDomain;
  method: ApiMethod;
  path: string;
  mockService: string;
  description: string;
  migrationPriority: 'P0' | 'P1' | 'P2';
}

export const EXAM_CLOSED_LOOP_API_CONTRACTS: ApiContractItem[] = [
  {
    id: 'auth-login',
    domain: 'auth',
    method: 'POST',
    path: '/api/v1/auth/login',
    mockService: 'authService.login',
    description: 'Password login returns bearer token, current user and mustChangePassword flag.',
    migrationPriority: 'P0',
  },
  {
    id: 'auth-logout',
    domain: 'auth',
    method: 'POST',
    path: '/api/v1/auth/logout',
    mockService: 'authService.logout',
    description: 'Logout endpoint for frontend auth loop.',
    migrationPriority: 'P0',
  },
  {
    id: 'auth-current-user',
    domain: 'auth',
    method: 'GET',
    path: '/api/v1/auth/me',
    mockService: 'authService.getCurrentUser',
    description: 'Current user, roles, student mapping and first-login password state.',
    migrationPriority: 'P0',
  },
  {
    id: 'auth-change-password',
    domain: 'auth',
    method: 'POST',
    path: '/api/v1/auth/change-password',
    mockService: 'authService.changePassword',
    description: 'Current user changes password; required for first login and post-reset login.',
    migrationPriority: 'P0',
  },
  {
    id: 'visible-class-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/classes',
    mockService: 'academicService.listVisibleClasses',
    description:
      'List classes visible to the current user and enforce class-level permission boundary.',
    migrationPriority: 'P0',
  },
  {
    id: 'admin-course-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/admin/courses',
    mockService: 'academicService.listAdminCourses',
    description: 'Admin course base data list.',
    migrationPriority: 'P0',
  },
  {
    id: 'admin-class-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/admin/classes',
    mockService: 'academicService.listAdminClasses',
    description: 'Admin teaching class base data list.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-roster-template',
    domain: 'auth',
    method: 'GET',
    path: '/api/v1/student-roster-template',
    mockService: 'studentAccountService.downloadStudentRosterTemplate',
    description: 'Download CSV template for student roster import.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-roster-import',
    domain: 'auth',
    method: 'POST',
    path: '/api/v1/classes/{classId}/students/import',
    mockService: 'studentAccountService.importStudents',
    description:
      'Import student roster, create accounts with initial password equal to student number last 6 digits, and skip existing students.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-account-list',
    domain: 'auth',
    method: 'GET',
    path: '/api/v1/classes/{classId}/students',
    mockService: 'studentAccountService.listClassStudents',
    description: 'List class student accounts and must-change-password state.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-password-reset',
    domain: 'auth',
    method: 'POST',
    path: '/api/v1/students/{studentId}/reset-password',
    mockService: 'studentAccountService.resetStudentPassword',
    description:
      'Teacher or TA resets student password to student number last 6 digits and requires password change.',
    migrationPriority: 'P0',
  },
  {
    id: 'question-list',
    domain: 'question',
    method: 'GET',
    path: '/api/v1/questions',
    mockService: 'questionService.listQuestions',
    description: 'Question bank list, filters and question pool reading.',
    migrationPriority: 'P0',
  },
  {
    id: 'ai-question-generate',
    domain: 'ai',
    method: 'POST',
    path: '/api/v1/ai/question-generations',
    mockService: 'aiQuestionService.generateAiQuestionDrafts',
    description: 'AI question generation task and candidate question drafts.',
    migrationPriority: 'P1',
  },
  {
    id: 'paper-list',
    domain: 'paper',
    method: 'GET',
    path: '/api/v1/papers',
    mockService: 'paperService.listPapers',
    description: 'Paper list and paper composition detail reading.',
    migrationPriority: 'P0',
  },
  {
    id: 'exam-create',
    domain: 'exam',
    method: 'POST',
    path: '/api/v1/exams',
    mockService: 'examService.createExam',
    description: 'Create an exam and bind paper, classes and time window.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-exam-list',
    domain: 'exam',
    method: 'GET',
    path: '/api/v1/student/exams',
    mockService: 'examService.listStudentExams',
    description: 'Student exam center list; student identity is resolved from current login token.',
    migrationPriority: 'P0',
  },
  {
    id: 'answer-draft-save',
    domain: 'answerSheet',
    method: 'PUT',
    path: '/api/v1/answer-sheets/{id}/draft',
    mockService: 'examService.saveAnswerDraft',
    description: 'Save student answer draft.',
    migrationPriority: 'P0',
  },
  {
    id: 'answer-submit',
    domain: 'answerSheet',
    method: 'POST',
    path: '/api/v1/answer-sheets/{id}/submit',
    mockService: 'examService.submitAnswerSheet',
    description: 'Submit answer sheet and trigger grading flow.',
    migrationPriority: 'P0',
  },
  {
    id: 'grading-task-list',
    domain: 'grading',
    method: 'GET',
    path: '/api/v1/grading-tasks',
    mockService: 'gradingService.listGradingTasks',
    description: 'Read grading task queue.',
    migrationPriority: 'P0',
  },
  {
    id: 'grading-review',
    domain: 'grading',
    method: 'POST',
    path: '/api/v1/grading-tasks/{id}/review',
    mockService: 'gradingService.reviewGradingTask',
    description: 'Teacher submits manual grading review.',
    migrationPriority: 'P0',
  },
  {
    id: 'score-publish',
    domain: 'score',
    method: 'POST',
    path: '/api/v1/exams/{examId}/publish-scores',
    mockService: 'gradingService.publishExamScores',
    description: 'Publish exam scores and expose them to students.',
    migrationPriority: 'P0',
  },
  {
    id: 'student-score-report',
    domain: 'score',
    method: 'GET',
    path: '/api/v1/student/score-reports',
    mockService: 'gradingService.listStudentScoreReports',
    description:
      'Student score feedback list and details; student identity is resolved from current login token.',
    migrationPriority: 'P0',
  },
  {
    id: 'review-report-list',
    domain: 'review',
    method: 'GET',
    path: '/api/v1/review-reports',
    mockService: 'reviewService.listExamReviewReports',
    description: 'Exam review report list.',
    migrationPriority: 'P1',
  },
  {
    id: 'lecture-draft-regenerate',
    domain: 'review',
    method: 'POST',
    path: '/api/v1/review-reports/{examId}/lecture-draft/regenerate',
    mockService: 'reviewService.regenerateLectureDraft',
    description: 'Regenerate AI lecture draft.',
    migrationPriority: 'P1',
  },
  {
    id: 'lecture-draft-approve',
    domain: 'review',
    method: 'POST',
    path: '/api/v1/review-reports/{examId}/lecture-draft/approve',
    mockService: 'reviewService.approveLectureDraft',
    description: 'Teacher approves AI lecture draft.',
    migrationPriority: 'P1',
  },
];
