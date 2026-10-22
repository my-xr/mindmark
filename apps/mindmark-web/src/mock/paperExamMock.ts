import { mockQuestions } from '@/mock/questionMock';
import type { Exam } from '@/types/exam';
import type { Paper, PaperQuestion } from '@/types/paper';
import type { Question } from '@/types/question';

const getQuestion = (id: string): Question => {
  const question = mockQuestions.find((item) => item.id === id);

  if (!question) {
    throw new Error(`Mock question ${id} not found`);
  }

  return question;
};

const createPaperQuestion = (questionId: string, order: number, score?: number): PaperQuestion => {
  const question = getQuestion(questionId);

  return {
    id: `PQ-${questionId}`,
    questionId,
    order,
    score: score ?? question.score,
    question,
  };
};

const buildTotalScore = (questions: PaperQuestion[]) =>
  questions.reduce((total, item) => total + item.score, 0);

const frontendQuestions = [
  createPaperQuestion('Q-1001', 1, 2),
  createPaperQuestion('Q-1002', 2, 4),
  createPaperQuestion('Q-1006', 3, 10),
];

const fullStackQuestions = [
  createPaperQuestion('Q-1003', 1, 2),
  createPaperQuestion('Q-1005', 2, 8),
];

// Stable mixed-question fixture for the student taking-page visual acceptance test.
// Real API acceptance uses MINDMARK_STUDENT_VISUAL_EXAM_ID instead.
const visualExamQuestions = [
  createPaperQuestion('Q-1001', 1, 10),
  createPaperQuestion('Q-1002', 2, 15),
  createPaperQuestion('Q-1003', 3, 10),
  createPaperQuestion('Q-1004', 4, 10),
  createPaperQuestion('Q-1005', 5, 25),
  createPaperQuestion('Q-1006', 6, 30),
];

const visualExamStartTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const visualExamEndTime = new Date(Date.now() + 115 * 60 * 1000).toISOString();

export const mockPapers: Paper[] = [
  {
    id: 'paper-001',
    title: '前端工程化阶段测验 A 卷',
    courseId: 'course-frontend-001',
    courseName: '前端工程化',
    description: '覆盖 JavaScript、Vue 3、HTTP 协议和接口设计基础能力。',
    durationMinutes: 90,
    totalScore: buildTotalScore(frontendQuestions),
    status: 'READY',
    questions: frontendQuestions,
    createdBy: '王老师',
    updatedAt: '2026-07-17 11:20',
  },
  {
    id: 'paper-002',
    title: 'Web 全栈能力综合练习卷',
    courseId: 'course-fullstack-001',
    courseName: 'Web 全栈开发',
    description: '覆盖数据库、接口设计和 JavaScript 进阶能力的综合训练。',
    durationMinutes: 120,
    totalScore: buildTotalScore(fullStackQuestions),
    status: 'DRAFT',
    questions: fullStackQuestions,
    createdBy: '李老师',
    updatedAt: '2026-07-16 17:45',
  },
  {
    id: 'paper-visual-001',
    title: '学生答题页视觉验收混合卷',
    courseId: 'course-frontend-001',
    courseName: '前端工程化',
    description: '用于验证不同题型答题卡分组、标记与答题交互。',
    durationMinutes: 120,
    totalScore: buildTotalScore(visualExamQuestions),
    status: 'READY',
    questions: visualExamQuestions,
    createdBy: '系统验收夹具',
    updatedAt: '2026-09-18 09:00',
  },
];

const getPaper = (id: string): Paper => {
  const paper = mockPapers.find((item) => item.id === id);

  if (!paper) {
    throw new Error(`Mock paper ${id} not found`);
  }

  return paper;
};

export const mockExams: Exam[] = [
  {
    id: 'exam-001',
    title: '前端工程化阶段测验',
    courseName: '前端工程化',
    paperId: 'paper-001',
    paper: getPaper('paper-001'),
    classNames: ['软件 2401 班', '软件 2402 班'],
    startTime: '2026-07-17 14:00',
    endTime: '2026-07-17 15:30',
    durationMinutes: 90,
    status: 'GRADING',
    participantCount: 86,
    submittedCount: 12,
    createdBy: '王老师',
  },
  {
    id: 'exam-002',
    title: 'Web 全栈能力周测',
    courseName: 'Web 全栈开发',
    paperId: 'paper-002',
    paper: getPaper('paper-002'),
    classNames: ['软件 2403 班'],
    startTime: '2026-07-18 09:00',
    endTime: '2026-07-18 11:00',
    durationMinutes: 120,
    status: 'SCHEDULED',
    participantCount: 42,
    submittedCount: 0,
    createdBy: '李老师',
  },
  {
    id: 'exam-003',
    title: '前端工程化课堂练习',
    courseName: '前端工程化',
    paperId: 'paper-001',
    paper: getPaper('paper-001'),
    classNames: ['软件 2401 班'],
    startTime: '2026-07-17 16:00',
    endTime: '2026-07-17 17:30',
    durationMinutes: 90,
    status: 'IN_PROGRESS',
    participantCount: 42,
    submittedCount: 0,
    createdBy: '王老师',
  },
  {
    id: 'exam-visual-001',
    title: '学生答题页视觉验收考试',
    courseName: '前端工程化',
    paperId: 'paper-visual-001',
    paper: getPaper('paper-visual-001'),
    classNames: ['视觉验收班'],
    startTime: visualExamStartTime,
    endTime: visualExamEndTime,
    durationMinutes: 120,
    status: 'IN_PROGRESS',
    participantCount: 10,
    submittedCount: 0,
    createdBy: '系统验收夹具',
  },
];
