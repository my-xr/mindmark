from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/review/service/ReviewService.java')
s = p.read_text(encoding='utf-8-sig')
lines = s.splitlines()
replacements = {
    323: '                    weaknessTags.add("得分率偏低");',
    325: '                    weaknessTags.add("步骤或表达需巩固");',
    328: '                    weaknessTags.add("低分答卷 " + value.riskCount + " 份");',
    341: '                    ? List.of("综合能力")',
    378: '            new StudentLayerInsightResponse("优秀层", excellent, "安排拓展题和讲题任务，促进高阶迁移。"),',
    379: '            new StudentLayerInsightResponse("稳定层", stable, "用易错题复盘和限时练习巩固稳定得分。"),',
    380: '            new StudentLayerInsightResponse("巩固层", consolidating, "围绕关键步骤和表达规范进行二次订正。"),',
    381: '            new StudentLayerInsightResponse("风险层", risk, "优先补齐基础概念，安排教师或助教跟进。")',
    428: '            case REVIEW_REPORT_MARKDOWN -> new ArtifactPayload(baseName + "-复盘报告.md", "text/markdown; charset=utf-8", buildReportMarkdown(report));',
    429: '            case LECTURE_DRAFT_MARKDOWN -> new ArtifactPayload(baseName + "-AI讲评稿.md", "text/markdown; charset=utf-8", report.lectureDraft().teacherEditedContent() == null ? report.lectureDraft().content() : report.lectureDraft().teacherEditedContent());',
    430: '            case SCORE_SUMMARY_CSV -> new ArtifactPayload(baseName + "-成绩汇总.csv", "text/csv; charset=utf-8", buildScoreCsv(report));',
    436: '        builder.append("# ").append(report.examTitle()).append(" 复盘分析报告\\n\\n");',
    437: '        builder.append("- 课程：").append(report.courseName()).append("\\n");',
    438: '        builder.append("- 满分：").append(report.totalScore()).append("\\n");',
    439: '        builder.append("- 平均分：").append(report.averageScore()).append("\\n");',
    440: '        builder.append("- 及格率：").append(report.passRate()).append("%\\n");',
    441: '        builder.append("- 已批改/已提交：").append(report.reviewedCount()).append("/").append(report.submittedCount()).append("\\n\\n");',
    442: '        builder.append("## 分数段\\n| 分数段 | 人数 | 占比 |\\n| --- | ---: | ---: |\\n");',
    444: '        builder.append("\\n## 知识薄弱点\\n");',
    445: '        report.knowledgeWeaknesses().forEach(item -> builder.append("- ").append(item.knowledgePoint()).append("：得分率 ").append(item.scoreRate()).append("%，").append(item.suggestion()).append("\\n"));',
    446: '        builder.append("\\n## 题目表现\\n");',
    447: '        report.questionPerformances().forEach(item -> builder.append("- 第 ").append(item.order()).append(" 题：").append(item.title()).append("：平均得分 ").append(item.averageScore()).append("/").append(item.maxScore()).append("，得分率 ").append(item.scoreRate()).append("%\\n"));',
    448: '        builder.append("\\n## 学生分层建议\\n");',
    449: '        report.studentLayerInsights().forEach(item -> builder.append("- ").append(item.layer()).append("：").append(item.count()).append(" 人；").append(item.suggestion()).append("\\n"));',
    489: '            draft.getExam().getTitle() + " AI讲评稿",',
    553: '            return knowledgePoint + "掌握较好，可安排迁移应用与高阶题巩固。";',
    556: '            return knowledgePoint + "处于可提升区间，建议结合错题复盘强化关键步骤。";',
    558: '        return knowledgePoint + "薄弱明显，建议回到基础概念并安排针对性练习。";',
}
for line_no, value in replacements.items():
    lines[line_no - 1] = value
p.write_text('\n'.join(lines) + '\n', encoding='utf-8')
