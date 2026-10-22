from pathlib import Path
p = Path('docs/21_考试闭环缺口分析与三轮收敛计划.md')
text = p.read_text(encoding='utf-8-sig')
old = '- AI 出题审核闭环 Smoke：`scripts/api-smoke/run-ai-question-loop-smoke.ps1 -BaseUrl http://localhost:8080 -Provider OPENAI -Count 2 -TimeoutSeconds 300`\n'
new = old + '- 管理端账号治理 Smoke：`scripts/api-smoke/run-admin-governance-smoke.ps1`\n'
if old in text and '管理端账号治理 Smoke' not in text:
    text = text.replace(old, new)
text = text.replace('题库、组卷、考试、账号、AI 出题审核四条核心链路的接口级 Smoke 均已通过', '题库、组卷、考试、账号、管理端账号治理、AI 出题审核等核心链路的接口级 Smoke 均已通过')
p.write_text(text, encoding='utf-8')