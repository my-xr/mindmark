# 22_编程题 OJ 与 Sandbox 最小闭环设计

## 1. 背景与目标

MindMark 已具备编程题录入、组卷、学生作答、教师复核与 AI 辅助评分能力，但企业级考试系统不能在后端主进程中直接执行学生代码。编程题需要逐步接入独立的 OJ / Sandbox Worker，用公开/隐藏测试用例形成可审计、可追踪、可复核的客观判题链路。

本阶段目标是先完成 **P0 落库与接口占位**：数据结构、权限边界、API 契约和前端服务类型先稳定下来；真实代码执行在后续独立 Sandbox Worker 中完成。

## 2. 安全边界

- 后端主进程只负责保存测试用例、创建判题任务、查询判题结果，不执行学生代码。
- 学生代码只保存为快照，等待独立 Sandbox Worker 消费。
- P0 判题任务状态固定进入 `QUEUED`，并写入 `judgeVersion = P0_CONTRACT_ONLY`。
- 隐藏测试用例仅允许教师、助教、管理员维护和查看，不向学生侧接口暴露。
- 后续 Worker 必须以独立进程/容器运行，并具备 CPU、内存、超时、网络隔离和文件系统隔离。

## 3. P0 已落地范围（2026-07-21）

### 3.1 数据表

迁移文件：

```text
apps/mindmark-server/src/main/resources/db/migration/V25__programming_judge_p0_schema.sql
```

新增表：

1. `programming_test_case`
   - 编程题测试用例。
   - 关联 `question_id`。
   - 支持 `PUBLIC` / `HIDDEN` 可见性、权重、排序、创建人和审计时间。
2. `programming_judge_submission`
   - 学生编程题判题提交任务。
   - 关联考试、答卷、答题项、题目和学生。
   - 保存语言、源码快照、状态、分数、满分、排队/开始/结束时间和判题版本。
3. `programming_judge_result`
   - 单个测试用例的判题结果。
   - 保存状态、实际输出摘要、错误输出摘要、耗时、内存、是否通过和得分。

状态枚举：

```text
QUEUED, RUNNING, ACCEPTED, WRONG_ANSWER, PARTIAL_ACCEPTED,
COMPILE_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED,
MEMORY_LIMIT_EXCEEDED, SYSTEM_ERROR, CANCELLED
```

### 3.2 后端模块

新增模块：

```text
apps/mindmark-server/src/main/java/com/mindmark/server/modules/programming
```

核心文件：

- `domain/*`：测试用例、判题提交、判题结果实体与枚举。
- `repository/*`：JPA 仓储。
- `dto/*`：请求/响应契约。
- `service/ProgrammingJudgeService.java`：权限校验、测试用例维护、P0 判题任务创建。
- `web/ProgrammingJudgeController.java`：REST API。

### 3.3 API 契约

教师/助教/管理员维护测试用例：

```http
GET    /api/v1/questions/{questionId}/programming-test-cases?page=&pageSize=
POST   /api/v1/questions/{questionId}/programming-test-cases
PUT    /api/v1/programming-test-cases/{caseId}
DELETE /api/v1/programming-test-cases/{caseId}
```

学生提交编程题判题任务与查询：

```http
POST /api/v1/exams/{examId}/answer-sheets/{answerSheetId}/programming-submissions
GET  /api/v1/programming-submissions/{submissionId}
```

批改中心查看判题结果：

```http
GET /api/v1/grading-tasks/{gradingTaskId}/programming-judge-results?page=&pageSize=
```

### 3.4 前端服务占位

新增：

```text
apps/mindmark-web/src/services/programmingJudgeService.ts
```

提供真实接口调用与 Mock 兼容占位类型：

- 测试用例分页查询、创建、更新、删除。
- 判题提交创建、查询。
- 批改任务下的编程题判题结果分页查询。

## 4. P0 验收记录

- Flyway：`V25__programming_judge_p0_schema.sql` 已在本地 `mindmark` 数据库记录成功。
- 后端编译：`mvn -f apps/mindmark-server/pom.xml compile` 通过。
- 前端类型检查：`pnpm web:typecheck` 通过。
- 接口 Smoke：新增 `scripts/api-smoke/run-programming-judge-p0-smoke.ps1`，已通过编程题创建、测试用例创建/分页/更新/删除和清理验证。

Smoke 命令示例：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-programming-judge-p0-smoke.ps1 -BaseUrl http://localhost:18084
```

## 5. 后续 P1/P2 计划

### P1：前端页面入口

- 题库管理：编程题详情/编辑中增加“测试用例”区域。
- 学生考试页：编程题答案区增加“提交判题 / 查看判题状态”。
- 批改中心：展示每个测试用例状态，教师默认采纳系统判题分，可复核覆盖。

### P2：独立 Sandbox Worker

- 增加判题任务消费接口或消息队列。
- Worker 拉取 `QUEUED` 任务后进入 `RUNNING`。
- 隔离执行代码，写回用例级结果和总分。
- 增加超时重试、取消、死信、审计日志和资源用量记录。

### P3：评分闭环增强

- 按测试用例权重计算客观得分。
- 支持公开样例自测与隐藏用例正式判题分离。
- 批改中心一键采纳系统判题分，并将编程题 OJ 分数纳入总成绩发布。