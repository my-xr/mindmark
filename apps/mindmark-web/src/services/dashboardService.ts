import type { StatusTone } from '@/constants/status';
import { apiGet, useMockApi } from '@/services/api/httpClient';
import { listAiQuestionDrafts } from '@/services/aiQuestionService';
import { listExams } from '@/services/examService';
import { listGradingTasks, listExamScoreSummaries } from '@/services/gradingService';
import { listQuestionsPage } from '@/services/questionService';

export interface TeacherDashboardMetric {
  label: string;
  value: string;
  hint: string;
}

export interface TeacherDashboardTask {
  name: string;
  meta: string;
  status: string;
  tone: StatusTone;
  to: string;
}

export interface TeacherDashboardData {
  metrics: TeacherDashboardMetric[];
  tasks: TeacherDashboardTask[];
}

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

async function getAggregatedDashboardData(): Promise<TeacherDashboardData> {
  const [questionPage, exams, gradingTasks, scoreSummaries, aiDrafts] = await Promise.all([
    listQuestionsPage({ page: 1, pageSize: 1 }),
    listExams(),
    listGradingTasks(),
    listExamScoreSummaries(),
    listAiQuestionDrafts('PENDING_REVIEW'),
  ]);

  const inProgressExams = exams.filter((exam) => exam.status === 'IN_PROGRESS');
  const upcomingExams = exams.filter((exam) => exam.status === 'SCHEDULED');
  const pendingGradingTasks = gradingTasks.filter((task) => task.status !== 'REVIEWED');
  const unpublishedScores = scoreSummaries.filter(
    (summary) => summary.publishStatus === 'UNPUBLISHED',
  );

  const tasks: TeacherDashboardTask[] = [
    ...inProgressExams.slice(0, 2).map((exam) => ({
      name: exam.title,
      meta: `${exam.courseName} · ${exam.submittedCount}/${exam.participantCount} 已交卷 · ${exam.endTime} 结束`,
      status: '考试进行中',
      tone: 'info' as const,
      to: '/teacher/exams',
    })),
    ...pendingGradingTasks.slice(0, 2).map((task) => ({
      name: `${task.examTitle} · ${task.studentName}`,
      meta: `${task.className} · 当前 ${task.currentScore}/${task.totalScore} 分 · ${task.submittedAt}`,
      status: task.status === 'AI_GRADED' ? '待复核' : '待批改',
      tone: 'warning' as const,
      to: '/teacher/grading',
    })),
    ...unpublishedScores.slice(0, 2).map((summary) => ({
      name: `${summary.examTitle} 成绩发布`,
      meta: `${summary.reviewedCount}/${summary.submittedCount} 已复核 · 均分 ${summary.averageScore}`,
      status: '待发布',
      tone: 'success' as const,
      to: '/teacher/grading',
    })),
    ...(aiDrafts.length
      ? [
          {
            name: 'AI 生成题目审核',
            meta: `当前有 ${aiDrafts.length} 道 AI 题目等待教师审核入库`,
            status: '待审核',
            tone: 'warning' as const,
            to: '/teacher/ai-questions',
          },
        ]
      : []),
    ...upcomingExams.slice(0, 1).map((exam) => ({
      name: exam.title,
      meta: `${exam.courseName} · ${exam.startTime} 开始 · ${exam.participantCount} 人`,
      status: '待开始',
      tone: 'processing' as const,
      to: '/teacher/exams',
    })),
  ];

  return {
    metrics: [
      {
        label: '题库题目',
        value: formatNumber(questionPage.total),
        hint: '来自题库真实分页总量',
      },
      {
        label: '进行中考试',
        value: formatNumber(inProgressExams.length),
        hint: `${upcomingExams.length} 场待开始`,
      },
      {
        label: '待复核答卷',
        value: formatNumber(pendingGradingTasks.length),
        hint: `${gradingTasks.length} 个批改任务`,
      },
      {
        label: '待发布成绩',
        value: formatNumber(unpublishedScores.length),
        hint: `${scoreSummaries.length} 场考试成绩汇总`,
      },
    ],
    tasks: tasks.slice(0, 6),
  };
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  if (!useMockApi) {
    return apiGet<TeacherDashboardData>('/v1/teacher/dashboard');
  }

  return getAggregatedDashboardData();
}
