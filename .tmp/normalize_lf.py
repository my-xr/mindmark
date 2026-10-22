from pathlib import Path
files=['apps/mindmark-web/e2e/teacher-pages.spec.ts','apps/mindmark-web/playwright.config.ts','apps/mindmark-web/src/components/common/EnterprisePagination.vue','apps/mindmark-web/src/views/teacher/AiQuestionsView.vue','apps/mindmark-web/eslint.config.js','apps/mindmark-web/package.json','package.json','docs/21_考试闭环缺口分析与三轮收敛计划.md']
for f in files:
    p=Path(f)
    b=p.read_bytes()
    b=b.replace(b'\r\n', b'\n').replace(b'\r', b'\n')
    if b.startswith(b'\xef\xbb\xbf'):
        b=b[3:]
    p.write_bytes(b)
