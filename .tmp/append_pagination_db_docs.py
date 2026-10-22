from pathlib import Path
updates = {
    'docs/19_后端接口契约准备.md': '''

## 分页数据库级优化与权限过滤下沉（2026-07-21）

本轮将批改中心与成绩中心的分页从“接口返回 PageResponse + 服务层内存切片”升级为 Repository/Pageable 数据库级分页：

- `GET /api/v1/grading-tasks?page&pageSize`：使用 `GradingTaskRepository.pageVisibleTasks(...)`，在 JPQL 层完成考试班级权限过滤与 `count` 统计；教师/助教必须拥有考试全部班级权限，管理员可查看全部。
- `GET /api/v1/grading-tasks/{gradingTaskId}/items?page&pageSize`：使用 `GradingItemRepository.findByGradingTaskIdOrderByCreatedAtAsc(...)` 逐页读取批改题目，只查询当前页对应答题项，避免 30-50 题答卷一次性加载。
- `GET /api/v1/score-summaries?page&pageSize`：使用 `ExamRepository.pageVisibleExamsWithGradingTasks(...)` 只分页查询有批改任务的可见考试。
- `GET /api/v1/exams/{examId}/score-reports?page&pageSize`：使用 `GradingTaskRepository.findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(...)` 按分数降序数据库分页，页内排名按全局偏移计算。

分页兜底规则：`page` 从 1 开始；`pageSize` 最大 100；当请求页超过最后一页时，后端会自动回落到最后一页，避免前端出现空页。自动化验收新增 `scripts/api-smoke/run-pagination-contract-smoke.ps1`，并已接入 `scripts/run-local-acceptance.ps1`。
''',
    'docs/08_API设计规范.md': '''

### 数据库级分页与权限过滤要求（2026-07-21）

对批改队列、成绩批次、成绩明细、答卷题目等数据增长型接口，分页必须优先下沉到 Repository/Pageable 层，不允许长期使用“查询全量后内存分页”作为企业级实现。权限过滤也应尽量进入查询条件：教师/助教只能访问其拥有全部班级权限的考试数据，管理员可访问全部数据。

自动化验收要求：新增分页接口时必须覆盖 `items/total/page/pageSize/totalPages/hasPrevious/hasNext` 元数据；当请求超大页码时，后端需要返回稳定页码而不是 500 或不可解释空页。
''',
    'docs/21_考试闭环缺口分析与三轮收敛计划.md': '''

## 19. 2026-07-21 分页数据库级优化、权限过滤下沉与自动化验收

### 19.1 已完成

- 批改中心答卷队列从服务层内存分页升级为 `GradingTaskRepository.pageVisibleTasks(...)` 数据库分页，并在查询层执行班级权限过滤。
- 批改中心答卷题目从加载整份答卷题目后切片升级为 `GradingItemRepository` 分页查询；当前页只补充当前页题目的学生答案。
- 成绩中心考试成绩批次从全量考试内存过滤升级为 `ExamRepository.pageVisibleExamsWithGradingTasks(...)` 数据库分页。
- 学生成绩明细从全量 reviewed task 内存分页升级为数据库按 `finalScore desc, updatedAt asc` 分页，并保留全局排名偏移。
- 新增 `PageResponseTest` 覆盖分页元数据、最大页大小限制、越界页回落等基础规则。
- 新增 `scripts/api-smoke/run-pagination-contract-smoke.ps1`，并接入本地一键验收脚本，覆盖批改队列、答卷题目、成绩批次、成绩明细分页契约。

### 19.2 验收状态

- 后端单元测试：`mvn -f apps/mindmark-server/pom.xml test` 通过，11 个测试全部成功。
- 本地验收脚本语法：`scripts/run-local-acceptance.ps1` 与新增分页 smoke 脚本均完成语法检查。

### 19.3 后续建议

下一轮建议把同样的数据库级分页策略继续推广到题库、试卷、AI 待审核题目、AI 任务历史、考试列表与安全审计事件，并补充对应 Repository 查询与 smoke 覆盖。
'''
}
for file, addition in updates.items():
    p = Path(file)
    s = p.read_text(encoding='utf-8')
    if addition.strip() not in s:
        p.write_text(s.rstrip() + addition, encoding='utf-8')
