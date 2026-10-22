const ERROR_CODE_MESSAGE_MAP: Record<string, string> = {
  'MM-400-001': '请求参数有误，请检查填写内容。',
  'MM-401-001': '登录状态已失效，请重新登录。',
  'MM-403-001': '当前账号没有执行此操作的权限。',
  'MM-404-001': '请求的资源不存在或已被删除。',
  'MM-409-001': '当前数据状态不允许执行此操作，请刷新后重试。',
  'MM-500-001': '服务器处理失败，请稍后重试；如果问题持续，请联系管理员。',
  'MM-501-001': '该功能尚未开放，请稍后再试。',
};

const BUSINESS_ERROR_MESSAGE_MAP: Array<[RegExp, string]> = [
  [/invalid username or password/i, '账号或密码错误，请检查后重试。'],
  [/old password is incorrect/i, '当前密码不正确，请重新输入。'],
  [/old password and new password are required/i, '请输入当前密码和新密码。'],
  [/new password must contain at least \d+ characters/i, '新密码至少需要 8 个字符。'],
  [/new password must be different from old password/i, '新密码不能与当前密码相同。'],
  [/new password must not be the same as username or email/i, '新密码不能直接使用账号或邮箱。'],
  [/new password must contain both letters and digits/i, '新密码必须同时包含字母和数字。'],
  [/user account is temporarily locked/i, '账号已被暂时锁定，请稍后再试或联系管理员。'],
  [/user account is disabled/i, '账号已被停用，请联系管理员。'],
  [/invalid auth session/i, '登录状态已失效，请重新登录。'],
  [/student profile not found/i, '学生档案不存在，请联系教师或管理员修复账号关联。'],
  [/student account not found/i, '学生账号不存在，请联系教师或管理员。'],
  [/ai question workflow failed/i, 'AI 出题工作流执行失败，请检查 Provider 配置后重试。'],
  [
    /ai provider (request|returned|connection)/i,
    'AI 服务请求失败，请检查服务器地址、模型和 API Key。',
  ],
  [/ai quality gate failed/i, 'AI 题目质量校验未通过，请调整要求后重试。'],
  [/failed to parse ai question json/i, 'AI 返回内容格式不正确，请稍后重试。'],
  [/internal server error/i, '服务器处理失败，请稍后重试；如果问题持续，请联系管理员。'],
  [/authentication required|unauthorized|invalid auth/i, '登录状态已失效，请重新登录。'],
  [/access denied|forbidden|permission/i, '当前账号没有执行此操作的权限。'],
  [/request failed with status code \d+/i, '请求处理失败，请稍后重试。'],
  [/network error|failed to fetch|network request failed/i, '无法连接服务器，请检查网络后重试。'],
  [/Only READY or PUBLISHED papers can create exams/i, '仅“已就绪”或“已发布”的试卷可以创建考试。'],
  [/Paper must contain at least one question/i, '试卷至少需要包含 1 道题目后才能创建考试。'],
  [
    /Target classes do not have any imported students/i,
    '所选班级尚未导入学生名单，请先导入学生后再创建考试。',
  ],
  [/classIds must not be empty/i, '请选择至少一个参考班级。'],
  [/Exam endAt must be after startAt/i, '考试结束时间必须晚于开始时间。'],
  [/Exam duration must not exceed the exam time window/i, '考试时长不能超过考试时间窗口。'],
  [/Question not found/i, '题目不存在或已被删除。'],
  [/Course not found/i, '课程不存在或无权访问。'],
  [/Paper not found/i, '试卷不存在或无权访问。'],
  [/resource not found|not found/i, '请求的资源不存在或已被删除。'],
  [/score must be greater than or equal to 0/i, '分值必须大于或等于 0。'],
  [
    /(title|courseId|type|difficulty|answer|analysis) is required/i,
    '请补全题干、课程、题型、难度、答案和解析等必填项。',
  ],
];

type ErrorLike = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
};

const toErrorLike = (error: unknown): ErrorLike => {
  if (error instanceof Error) {
    return error as Error & ErrorLike;
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    return error as ErrorLike;
  }

  return {};
};

export const getErrorMessage = (error: unknown, fallback = '操作失败，请稍后重试') => {
  const errorLike = toErrorLike(error);
  const rawMessage =
    typeof errorLike.message === 'string' && errorLike.message.trim()
      ? errorLike.message.trim()
      : fallback;
  const matched = BUSINESS_ERROR_MESSAGE_MAP.find(([pattern]) => pattern.test(rawMessage));

  if (matched) {
    return matched[1];
  }

  if (/[\u3400-\u9fff]/u.test(rawMessage)) {
    return rawMessage;
  }

  const code = typeof errorLike.code === 'string' ? errorLike.code : '';
  if (code && ERROR_CODE_MESSAGE_MAP[code]) {
    return ERROR_CODE_MESSAGE_MAP[code];
  }

  const status = typeof errorLike.status === 'number' ? errorLike.status : undefined;
  if (status === 401) {
    return '登录状态已失效，请重新登录。';
  }
  if (status === 403) {
    return '当前账号没有执行此操作的权限。';
  }
  if (status === 404) {
    return '请求的资源不存在或已被删除。';
  }
  if (status === 409) {
    return '当前数据状态不允许执行此操作，请刷新后重试。';
  }
  if (status && status >= 500) {
    return '服务器处理失败，请稍后重试；如果问题持续，请联系管理员。';
  }

  return rawMessage === fallback ? fallback : '操作失败，请稍后重试。';
};
