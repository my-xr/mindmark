from pathlib import Path
p = Path('apps/mindmark-web/e2e/teacher-bulk-visual.spec.ts')
s = p.read_text(encoding='utf-8-sig')
old = """async function exerciseFirstPagination(page: Page) {\n  const nextButton = page\n    .locator('.enterprise-pagination .ant-pagination-next:not(.ant-pagination-disabled) button')\n    .first();\n  if ((await nextButton.count()) === 0) {\n    return false;\n  }\n  await nextButton.click();\n  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);\n  return true;\n}\n"""
new = """async function firstVisiblePagination(page: Page) {\n  return page\n    .locator('.enterprise-pagination:visible, .ant-table-pagination:visible, .ant-pagination:visible')\n    .first();\n}\n\nasync function exerciseFirstPagination(page: Page) {\n  const nextButton = page\n    .locator(\n      [\n        '.enterprise-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',\n        '.ant-table-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',\n        '.ant-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',\n      ].join(', '),\n    )\n    .first();\n  if ((await nextButton.count()) === 0) {\n    return false;\n  }\n  await nextButton.scrollIntoViewIfNeeded();\n  await nextButton.click();\n  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);\n  return true;\n}\n"""
if old not in s:
    raise SystemExit('old block not found')
p.write_text(s.replace(old, new), encoding='utf-8')
