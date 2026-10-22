import type { Difficulty, QuestionType } from '@/types/question';

import type { StatusMeta } from './status';

export const QUESTION_TYPE_META: Record<QuestionType, StatusMeta & { shortLabel: string }> = {
  SINGLE_CHOICE: { label: '单选题', shortLabel: '单选', tone: 'info' },
  MULTIPLE_CHOICE: { label: '多选题', shortLabel: '多选', tone: 'processing' },
  TRUE_FALSE: { label: '判断题', shortLabel: '判断', tone: 'default' },
  FILL_BLANK: { label: '填空题', shortLabel: '填空', tone: 'warning' },
  SHORT_ANSWER: { label: '简答题', shortLabel: '简答', tone: 'success' },
  ESSAY: { label: '论述题', shortLabel: '论述', tone: 'success' },
  CASE_ANALYSIS: { label: '案例分析题', shortLabel: '案例', tone: 'processing' },
  PROGRAMMING: { label: '编程题', shortLabel: '编程', tone: 'danger' },
};

export const DIFFICULTY_META: Record<Difficulty, StatusMeta> = {
  VERY_EASY: { label: '很简单', tone: 'success' },
  EASY: { label: '简单', tone: 'success' },
  MEDIUM: { label: '中等', tone: 'warning' },
  HARD: { label: '困难', tone: 'danger' },
  VERY_HARD: { label: '很困难', tone: 'danger' },
};
