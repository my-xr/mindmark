# MindMark API Smoke Scripts

本目录用于本地运行态联调与端到端验收。脚本默认覆盖考试闭环，并扩展考试安全审计、考试时间窗口强一致、超时自动交卷与缺考场景。

## 1. 启动后端

> 开发数据库必须使用 `mindmark`，不要使用 PostgreSQL 默认 `postgres` 数据库。

```powershell
$env:MINDMARK_SERVER_PORT="18081"
$env:MINDMARK_DB_HOST="localhost"
$env:MINDMARK_DB_PORT="5432"
$env:MINDMARK_DB_NAME="mindmark"
$env:MINDMARK_DB_USERNAME="postgres"
$env:MINDMARK_DB_PASSWORD="123456"
$env:MINDMARK_REDIS_HOST="localhost"
$env:MINDMARK_REDIS_PORT="6379"
$env:MINDMARK_MINIO_ENDPOINT="http://localhost:9000"
$env:MINDMARK_MINIO_ACCESS_KEY="minioadmin"
$env:MINDMARK_MINIO_SECRET_KEY="minioadmin123"
$env:MINDMARK_MINIO_BUCKET="mindmark-artifacts"
# 仅在本地需要浏览 OpenAPI 时开启；生产环境保持 false。
$env:MINDMARK_OPENAPI_ENABLED="false"
pnpm server:run
```

> 仓库中只允许记录本地开发默认凭据；不要把 Kimi API Key、生产数据库密码、生产 MinIO 密码写入仓库。需要 AI 能力联调时只通过环境变量 `KIMI_API_KEY` 注入。

## 2. 启动前端真实接口模式

```powershell
$env:VITE_USE_MOCK="false"
$env:VITE_API_PROXY_TARGET="http://localhost:18081"
pnpm web:dev
```

前端默认通过 Vite proxy 将 `/api/*` 转发到后端。生产或独立联调时可设置 `VITE_API_BASE_URL`。

## 3. 执行考试闭环 Smoke

推荐使用自动化闭环脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-exam-loop-smoke.ps1 -BaseUrl http://localhost:18081
```

也可使用 package script（默认 `http://localhost:8080`，如端口不同需直接调用脚本传参）：

```powershell
pnpm server:smoke
```

### 3.1 Sa-Token 与角色边界 Smoke

用于验证“登录态 + 数据权限 + 学生答题数据脱敏”，不会创建或删除业务数据：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-authz-security-smoke.ps1 `
  -BaseUrl http://localhost:8080 `
  -TeacherUsername teacher@mindmark.local `
  -TeacherPassword dev-password `
  -StudentUsername 20260722120655 `
  -StudentPassword Mindmark123
```

验收标准：

- 未登录或仅伪造 `X-MindMark-*` 请求头访问受保护接口返回 `401`；
- 学生访问题库、教师试卷列表、教师考试列表、成绩批次、学生名单模板返回 `403`；
- 教师/管理员可以访问对应教师端列表；
- 学生只能读取本人班级考试关联的试卷；
- 学生试卷题目响应中的 `answer`、`analysis`、`scoringPoints` 和审核元数据必须为空。

生产前必须使用独立角色账号和明确的数据范围补充执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-authz-security-smoke.ps1 `
  -RequireIndependentRoles `
  -TeacherUsername <teacher> -TeacherPassword <password> `
  -TaUsername <ta> -TaPassword <password> `
  -StudentUsername <student> -StudentPassword <password> `
  -AssignedCourseId <assigned-course-id> -OutOfScopeCourseId <other-course-id>
```

该模式会拒绝混合角色账号、验证 TA 不能访问管理员接口，并确认教师/TA 访问授权课程成功、访问未授权课程返回 `403`。

### 3.2 登录限流 Smoke

该脚本使用随机生成的、不存在的账号，不修改任何已有用户数据。默认验证同一账号前 10 次失败登录返回 `401`，第 11 次触发账号维度限流并返回 `429`：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-login-rate-limit-smoke.ps1 `
  -BaseUrl http://localhost:18082
```

如果调整了 `MINDMARK_LOGIN_RATE_LIMIT_ACCOUNT_MAX_ATTEMPTS`，可显式传入更多尝试次数：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-login-rate-limit-smoke.ps1 `
  -BaseUrl http://localhost:18082 `
  -AttemptCount 15
```

在测试实例将窗口缩短为 60 秒后，可额外验证窗口恢复；恢复请求应回到业务层 `401`：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-login-rate-limit-smoke.ps1 `
  -BaseUrl http://localhost:18082 `
  -AttemptCount 11 -RecoveryWaitSeconds 60
```

Round 3 脚本覆盖：

1. 健康检查与教师登录。
2. 创建课程/班级，导入学生；学生首次登录后强制改密。
3. 试卷状态确认、创建考试、学生获取考试与答卷。
4. 未来考试时间窗口校验：未到 `startAt` 前保存草稿和交卷都必须返回冲突。
5. 草稿保存、考试安全事件上报、教师查询安全审计、版本冲突 409、交卷幂等。
6. 批改任务生成、客观题自动批改、教师复核、成绩汇总与发布、学生查分。
7. 复盘报告、AI 讲评稿确认、复盘导出产物。
8. 环境中存在待审 AI 题时，执行 AI 题目审核入库断言；没有待审题时记录跳过。
9. 已保存草稿在 `endAt` 后自动进入提交/批改流。
10. 未产生有效草稿的学生在考试结束后标记为 `ABSENT` 缺考。

## 4. 手工执行 Smoke

使用 VS Code REST Client、JetBrains HTTP Client 或兼容 `.http` 文件的工具打开：

```text
scripts/api-smoke/mindmark-exam-loop.http
```

执行顺序建议：健康检查 -> 题库/试卷/考试列表 -> 创建考试 -> 学生列表 -> 保存草稿 -> 交卷 -> 批改 -> 成绩发布。

## 5. 已知运行态前置条件

- PostgreSQL 必须能以 `MINDMARK_DB_USERNAME/MINDMARK_DB_PASSWORD` 连接 `mindmark` 数据库。
- Flyway 会在启动时执行 `apps/mindmark-server/src/main/resources/db/migration` 下的迁移。
- Redis 必须启动：Sa-Token 会使用 Redis 保存会话，登录接口还使用 Redis 执行账号/IP 双维度限流。Redis 不可用时登录安全服务 fail-closed，不应把它当作可选依赖。
- 登录限流默认配置：5 分钟内单账号最多 10 次、单 IP 最多 50 次；可用 `MINDMARK_LOGIN_RATE_LIMIT_*` 环境变量调整。
- MinIO 当前为产物存储预留；P0 考试闭环接口不上传文件。
- 生产 profile 使用 `--spring.profiles.active=prod` 时，必须注入数据库、Redis、AI 加密密钥和 MinIO 环境变量；生产禁止 `mindmark-local-ai-key-secret`、`minioadmin`、`minioadmin123` 等本地默认值。

## 6. Smoke 数据清理

清理脚本默认只做 dry-run，并且要求明确的运行批次；不会因为一个通用的 `Smoke` 或 `E2E` 关键字误删业务数据：

```powershell
# 只查看某次运行的匹配范围、依赖统计和样本，报告写入 target/maintenance/
powershell -ExecutionPolicy Bypass -File scripts/maintenance/cleanup-smoke-data.ps1 `
  -RunId 20261022153000

# 只有确认 dry-run 报告后，才允许带完整数据库备份执行删除
powershell -ExecutionPolicy Bypass -File scripts/maintenance/cleanup-smoke-data.ps1 `
  -RunId 20261022153000 -Execute -Force `
  -BackupPath target/maintenance/mindmark-before-cleanup.dump
```

历史数据若没有可靠运行批次，只能显式加 `-IncludeLegacyPatterns` 后先审阅报告。脚本会检查题目是否仍被非目标试卷、答卷、批改或编程提交引用，发现外部依赖就中止；新增的课程章节、学生导入任务和审计记录也会纳入依赖清理顺序。JSON 报告会直接记录目标计数、样本和外部引用明细，`.log` 保留完整 psql 输出。

## 7. 课程章节范围 Smoke

该脚本会创建带运行批次的 JavaWeb 课程、1-10 章及每章题目，使用第 1-8 章范围组卷，并验证质量报告和 Markdown 指定章节导入：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-chapter-scope-smoke.ps1 `
  -BaseUrl http://localhost:8080
```

脚本只创建带 `RunId` 的验收数据，不自动删除；完成审阅后用第 6 节的清理脚本按同一个 `RunId` dry-run，再在需要时带备份执行。

## 8. 验证记录

- 2026-07-18：已确认本地 PostgreSQL `mindmark` 数据库、`postgres/123456` 凭据可用，后端可完成 Flyway 启动。
- 2026-07-18：Round 3 `run-exam-loop-smoke.ps1 -BaseUrl http://localhost:18081` 已通过，覆盖正常交卷、超时自动提交、缺考、批改、成绩发布与学生查分。
- 2026-07-19：脚本已补充安全审计上报/查询、考前时间窗口冲突校验、AI 题目审核可选断言。
- 2026-09-24：安全 Smoke 增加学生访问批改/复盘/教师工作台/AI Provider/安全审计以及教师访问学生接口的 `403` 断言；后端测试通过，真实权限 Smoke 已在 Redis 6379 和后端 18082 恢复后执行并通过。
- 2026-09-24：登录限流 Smoke 通过；同一随机探测账号前 10 次返回 `401`，第 11 次返回 `429`。
- 2026-10-22：章节范围 Smoke 真实 HTTP 通过（RunId `20261022210500`）；清理脚本同批次 dry-run 统计 1 门课程、10 个章节、11 道题目、1 套试卷，未执行删除。
