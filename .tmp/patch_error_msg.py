from pathlib import Path
p=Path('apps/mindmark-web/src/utils/errorMessage.ts')
s=r'''const BUSINESS_ERROR_MESSAGE_MAP: Array<[RegExp, string]> = [
  [/Only READY or PUBLISHED papers can create exams/i, '仅“已就绪”或“已发布”的试卷可以创建考试。'],
  [/Paper must contain at least one question/i, '试卷至少需要包含 1 道题目后才能创建考试。'],
  [/Target classes do not have any imported students/i, '所选班级尚未导入学生名单，请先导入学生后再创建考试。'],
  [/classIds must not be empty/i, '请选择至少一个参考班级。'],
  [/Exam endAt must be after startAt/i, '考试结束时间必须晚于开始时间。'],
  [/Exam duration must not exceed the exam time window/i, '考试时长不能超过考试时间窗口。'],
  [/Question not found/i, '题目不存在或已被删除。'],
  [/Course not found/i, '课程不存在或无权访问。'],
  [/Paper not found/i, '试卷不存在或无权访问。'],
  [/score must be greater than or equal to 0/i, '分值必须大于或等于 0。'],
  [/(title|courseId|type|difficulty|answer|analysis) is required/i, '请补全题干、课程、题型、难度、答案和解析等必填项。'],
];

export const getErrorMessage = (error: unknown, fallback = '操作失败，请稍后重试') => {
  const rawMessage = error instanceof Error && error.message ? error.message : fallback;
  const matched = BUSINESS_ERROR_MESSAGE_MAP.find(([pattern]) => pattern.test(rawMessage));

  return matched?.[1] ?? rawMessage;
};
'''
p.write_text(s, encoding='utf-8')
