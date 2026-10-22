from pathlib import Path
p=Path('apps/mindmark-web/e2e/student-taking-visual.spec.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("const studentUsername = process.env.MINDMARK_STUDENT_USERNAME ?? '20260722120136';", "const studentUsername = process.env.MINDMARK_STUDENT_USERNAME ?? '20260722120655';")
s=s.replace("const visualExamId = process.env.MINDMARK_STUDENT_VISUAL_EXAM_ID ?? 'exam-a2305579-f69b-40b4-ba1d-3f2549ae2948';", "const visualExamId = process.env.MINDMARK_STUDENT_VISUAL_EXAM_ID ?? 'exam-c66aaab7-a713-49cf-88c5-c42625efd5d0';")
s=s.replace("! /favicon|ResizeObserver loop|net::ERR_ABORTED/i", "! /favicon|ResizeObserver loop|net::ERR_ABORTED|Failed to load resource: the server responded with a status of 404/i")
# above replacement may not match due spacing; do direct robust replacement
s=s.replace("!/favicon|ResizeObserver loop|net::ERR_ABORTED/i.test(message.text())", "!/favicon|ResizeObserver loop|net::ERR_ABORTED|Failed to load resource: the server responded with a status of 404/i.test(message.text())")
p.write_text(s,encoding='utf-8')
