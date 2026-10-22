export const PASSWORD_MIN_LENGTH = 8;

const LETTER_PATTERN = /\p{L}/u;
const DIGIT_PATTERN = /\p{Nd}/u;

export interface PasswordRuleState {
  id: 'length' | 'letter' | 'digit' | 'different';
  label: string;
  valid: boolean;
}

export const getPasswordRuleStates = (password: string, oldPassword = ''): PasswordRuleState[] => [
  {
    id: 'length',
    label: `至少 ${PASSWORD_MIN_LENGTH} 个字符`,
    valid: password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'letter',
    label: '同时包含字母',
    valid: LETTER_PATTERN.test(password),
  },
  {
    id: 'digit',
    label: '同时包含数字',
    valid: DIGIT_PATTERN.test(password),
  },
  {
    id: 'different',
    label: '不能与当前密码相同',
    valid: Boolean(password) && password !== oldPassword,
  },
];

export const validateNewPassword = (
  password: string,
  oldPassword: string,
  accountIdentifiers: Array<string | undefined> = [],
): string | null => {
  if (!password) {
    return '请输入新密码。';
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `新密码至少需要 ${PASSWORD_MIN_LENGTH} 个字符。`;
  }

  if (!LETTER_PATTERN.test(password) || !DIGIT_PATTERN.test(password)) {
    return '新密码必须同时包含字母和数字。';
  }

  if (password === oldPassword) {
    return '新密码不能与当前密码相同。';
  }

  if (
    accountIdentifiers
      .filter((identifier): identifier is string => Boolean(identifier))
      .some((identifier) => password.toLowerCase() === identifier.toLowerCase())
  ) {
    return '新密码不能直接使用账号或邮箱。';
  }

  return null;
};
