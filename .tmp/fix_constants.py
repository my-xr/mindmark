from pathlib import Path
Path('apps/mindmark-web/src/constants/question.ts').write_text("""import type { Difficulty, QuestionType } from '@/types/question';

import type { StatusMeta } from './status';

export const QUESTION_TYPE_META: Record<QuestionType, StatusMeta & { shortLabel: string }> = {
  SINGLE_CHOICE: { label: '单选题', shortLabel: '单选', tone: 'info' },
  MULTIPLE_CHOICE: { label: '多选题', shortLabel: '多选', tone: 'processing' },
  TRUE_FALSE: { label: '判断题', shortLabel: '判断', tone: 'default' },
  FILL_BLANK: { label: '填空题', shortLabel: '填空', tone: 'warning' },
  SHORT_ANSWER: { label: '简答题', shortLabel: '简答', tone: 'success' },
  PROGRAMMING: { label: '编程题', shortLabel: '编程', tone: 'danger' },
};

export const DIFFICULTY_META: Record<Difficulty, StatusMeta> = {
  VERY_EASY: { label: '很简单', tone: 'success' },
  EASY: { label: '简单', tone: 'success' },
  MEDIUM: { label: '中等', tone: 'warning' },
  HARD: { label: '困难', tone: 'danger' },
  VERY_HARD: { label: '很困难', tone: 'danger' },
};
""", encoding='utf-8')
Path('apps/mindmark-web/src/constants/status.ts').write_text("""export type StatusTone = 'default' | 'processing' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const EXAM_STATUS_META: Record<string, StatusMeta> = {
  DRAFT: { label: '草稿', tone: 'default' },
  SCHEDULED: { label: '已发布未开始', tone: 'processing' },
  IN_PROGRESS: { label: '进行中', tone: 'info' },
  ENDED: { label: '已结束待批改', tone: 'warning' },
  GRADING: { label: '批改中', tone: 'warning' },
  GRADED: { label: '批改完成待发布', tone: 'success' },
  PUBLISHED: { label: '成绩已发布', tone: 'success' },
  ARCHIVED: { label: '已归档', tone: 'default' },
};

export const QUESTION_STATUS_META: Record<string, StatusMeta> = {
  DRAFT: { label: '草稿', tone: 'default' },
  PENDING_REVIEW: { label: '待审核', tone: 'warning' },
  ACTIVE: { label: '已入库', tone: 'success' },
  DISABLED: { label: '已停用', tone: 'danger' },
  REJECTED: { label: '已驳回', tone: 'danger' },
};

export const AI_REVIEW_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: '待人工审核', tone: 'warning' },
  ACCEPTED: { label: '已接收入库', tone: 'success' },
  EDITED_ACCEPTED: { label: '编辑后入库', tone: 'success' },
  REJECTED: { label: '已拒绝', tone: 'danger' },
};

export const AI_RISK_META: Record<string, StatusMeta> = {
  LOW_CONFIDENCE: { label: '低置信度', tone: 'warning' },
  AMBIGUOUS_STEM: { label: '题干疑似歧义', tone: 'warning' },
  ANSWER_NOT_UNIQUE: { label: '答案可能不唯一', tone: 'danger' },
  KNOWLEDGE_MISMATCH: { label: '知识点可能不匹配', tone: 'warning' },
  SCORING_POINT_WEAK: { label: '得分点偏弱', tone: 'info' },
};

export const PAPER_STATUS_META: Record<string, StatusMeta> = {
  DRAFT: { label: '草稿', tone: 'default' },
  READY: { label: '可用于考试', tone: 'success' },
  PUBLISHED: { label: '已关联考试', tone: 'processing' },
  ARCHIVED: { label: '已归档', tone: 'default' },
};

export const STUDENT_EXAM_STATUS_META: Record<string, StatusMeta> = {
  NOT_STARTED: { label: '未开始', tone: 'default' },
  AVAILABLE: { label: '可进入', tone: 'info' },
  ENDED: { label: '已结束', tone: 'warning' },
  SUBMITTED: { label: '已提交', tone: 'success' },
  GRADED: { label: '已出分', tone: 'success' },
  ABSENT: { label: '缺考', tone: 'danger' },
};

export const ANSWER_SHEET_STATUS_META: Record<string, StatusMeta> = {
  NOT_STARTED: { label: '未开始', tone: 'default' },
  IN_PROGRESS: { label: '答题中', tone: 'info' },
  SUBMITTED: { label: '已提交', tone: 'success' },
  ABSENT: { label: '缺考', tone: 'danger' },
};

export const GRADING_TASK_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: '待批改', tone: 'warning' },
  AI_GRADED: { label: 'AI 已预批', tone: 'info' },
  REVIEWED: { label: '复核完成', tone: 'success' },
};

export const SCORE_PUBLISH_STATUS_META: Record<string, StatusMeta> = {
  UNPUBLISHED: { label: '待发布', tone: 'warning' },
  PUBLISHED: { label: '已发布', tone: 'success' },
};

export const LECTURE_DRAFT_STATUS_META: Record<string, StatusMeta> = {
  DRAFT: { label: 'AI 草稿', tone: 'warning' },
  REVIEWING: { label: '待教师确认', tone: 'info' },
  APPROVED: { label: '已确认', tone: 'success' },
  FAILED: { label: '生成失败', tone: 'danger' },
};

export const REVIEW_INSIGHT_LEVEL_META: Record<string, StatusMeta> = {
  GOOD: { label: '掌握良好', tone: 'success' },
  WARNING: { label: '需要巩固', tone: 'warning' },
  RISK: { label: '重点讲评', tone: 'danger' },
};
""", encoding='utf-8')
