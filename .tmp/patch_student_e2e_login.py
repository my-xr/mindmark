from pathlib import Path
p=Path('apps/mindmark-web/e2e/student-exam-security.spec.ts')
s=p.read_text(encoding='utf-8')
old="""async function loginAsStudent(
  page: Page,
  username: string,
  password: string,
  target = '/student/exams',
) {
  await page.goto(target);

  if (/\\/auth\\/login/.test(page.url())) {
    await page.locator('input[autocomplete=\"username\"]').fill(username);
    await page.locator('input[autocomplete=\"current-password\"]').fill(password);
    await page.locator('form.auth-login-form button[type=\"submit\"]').click();
  }
}
"""
new="""async function loginAsStudent(
  page: Page,
  username: string,
  password: string,
  target = '/student/exams',
) {
  await page.goto(target);

  const visibleState = await Promise.race([
    page
      .locator('form.auth-login-form')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'login'),
    page
      .locator('.student-layout')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'student'),
  ]).catch(() => 'timeout');

  if (visibleState === 'login') {
    await page.locator('input[autocomplete=\"username\"]').fill(username);
    await page.locator('input[autocomplete=\"current-password\"]').fill(password);
    await page.locator('form.auth-login-form button[type=\"submit\"]').click();
  }
}
"""
if old not in s:
    raise SystemExit('old block not found')
s=s.replace(old,new)
p.write_text(s, encoding='utf-8', newline='\n')
