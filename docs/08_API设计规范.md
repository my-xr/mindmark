# 08 API 设计规范

> 文档状态：已重建为 UTF-8。更新时间：2026-07-19。  
> 本文定义 MindMark 前后端接口的统一风格、错误码、鉴权方式与 P0/P1 契约。

## 1. 基础约定

- 基础路径：`/api/v1`
- 请求/响应编码：`UTF-8`
- 请求体：`application/json`，文件上传使用 `multipart/form-data`
- 时间格式：ISO-8601 字符串，后端统一存储为数据库时间类型
- 分页参数：`page/pageSize`
- 排序参数：`sort`，格式示例：`createdAt,desc`

## 2. 统一响应结构

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

分页响应：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0
}
```

## 3. 错误码规范

| code | HTTP | 说明 |
| --- | --- | --- |
| `OK` | 200 | 成功 |
| `BAD_REQUEST` | 400 | 参数错误 |
| `UNAUTHORIZED` | 401 | 未登录或 Token 无效 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 状态冲突或重复提交 |
| `VALIDATION_FAILED` | 422 | 业务校验失败 |
| `INTERNAL_ERROR` | 500 | 服务端异常 |
| `AI_PROVIDER_ERROR` | 502 | AI Provider 调用失败 |

## 4. 鉴权与权限

- 鉴权方案：Sa-Token。
- 前端通过 `Authorization: Bearer <token>` 传递 Token。
- 后端按角色与资源归属校验权限。
- `ADMIN` 可访问管理后台；`TEACHER/TA` 可管理课程、题库、考试、批改；`STUDENT` 只能访问自己的考试与成绩。

## 5. 基础数据接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/courses` | 查询当前用户可见课程 |
| `GET` | `/classes` | 查询班级列表，可按课程过滤 |
| `GET` | `/students/import-template` | 下载学生导入模板 |
| `POST` | `/students/import` | 导入学生名单，重复学生跳过 |
| `GET` | `/students` | 查询学生列表 |
| `POST` | `/students/{id}/reset-password` | 教师/助教/管理员重置学生密码 |

## 6. 题库接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/questions` | 查询题目，支持 `courseId/type/difficulty/status/source/keyword` |
| `POST` | `/questions` | 手工创建题目 |
| `POST` | `/questions/import` | 批量导入题目 |
| `POST` | `/questions/import/markdown` | 一键导入 Markdown 题库，按课程名写入知识点并跳过重复题 |
| `POST` | `/questions/{id}/review` | AI 题目审核通过、编辑后通过或驳回 |
| `PATCH` | `/questions/{id}/status` | 启用/禁用题目 |

题目创建必须包含：`courseId/title/type/difficulty/score/answer/analysis`。

## 7. AI 出题接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/ai/provider-settings?provider=OPENAI|ANTHROPIC` | 查询当前教师的 Provider 连接参数与 Key 配置状态 |
| `PUT` | `/ai/provider-settings` | 保存当前教师的 Provider 连接参数（baseUrl / model / apiKey） |
| `POST` | `/ai/provider-settings/test` | 使用当前表单参数或已保存 Key 发起一次轻量模型连接测试，不落库、不返回明文 Key |
| `POST` | `/ai/questions/generate` | 调用 LangGraph + Provider 生成中文题目并写入待审核题库 |

Provider 规则：

- AI 出题主链路只支持 `OPENAI` 与 `ANTHROPIC`。
- 运行时 Key 优先级：教师个人 Key -> 对应全局环境变量。
- 响应不得返回明文 Key。
- `/ai/provider-settings/kimi` 仅旧前端兼容，不作为新开发入口。

## 8. 试卷与组卷接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/papers` | 查询试卷列表 |
| `POST` | `/papers` | 创建试卷 |
| `POST` | `/papers/{paperId}/questions` | 添加题目到试卷 |
| `DELETE` | `/papers/{paperId}/questions/{questionId}` | 移除题目 |
| `PATCH` | `/papers/{paperId}/status` | 标记试卷状态 |

约束：试卷课程与题目课程必须一致。

## 9. 考试与学生答题接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/exams` | 教师查询考试列表 |
| `POST` | `/exams` | 创建考试 |
| `PATCH` | `/exams/{id}/status` | 发布、关闭、归档考试 |
| `GET` | `/student/exams` | 学生查询可见考试 |
| `POST` | `/student/exams/{examId}/start` | 开始考试，生成或恢复答卷 |
| `PUT` | `/student/submissions/{id}/draft` | 保存答题草稿 |
| `POST` | `/student/submissions/{id}/submit` | 主动交卷 |
| `POST` | `/student/submissions/{id}/auto-submit` | 超时自动交卷 |
| `POST` | `/student/submissions/{id}/security-events` | 上报考试安全事件 |

## 10. 批改、成绩与复盘接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/grading/tasks` | 教师查询批改任务 |
| `POST` | `/grading/tasks/generate` | 生成批改任务 |
| `POST` | `/grading/tasks/{id}/objective-grade` | 客观题自动批改 |
| `PUT` | `/grading/tasks/{id}` | 教师提交主观题批改 |
| `GET` | `/scores/exams/{examId}` | 教师查询成绩汇总 |
| `POST` | `/scores/exams/{examId}/publish` | 发布成绩 |
| `GET` | `/student/scores` | 学生查询成绩反馈 |
| `GET` | `/reviews/exams/{examId}` | 查询考试复盘分析 |
| `POST` | `/reviews/exams/{examId}/lecture-draft` | 异步生成 AI 讲评稿 |
| `GET` | `/exports/{artifactId}/download` | 下载导出产物 |

## 11. OpenAPI 维护规则

- 后端接口变更必须同步更新 `apps/mindmark-server/openapi/mindmark-api.yaml`。
- 前端新增真实接口前，应先在 service 层定义类型，不在页面内拼接裸请求。
- 破坏性字段变更必须同步更新 `docs/12_需求变更与决策记录.md`。

## 分页契约补充（2026-07-21）

面向题库、试卷、AI 出题任务、批改队列、成绩批次等可能持续增长的列表接口，统一使用分页响应：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false
}
```

约定：
- `page` 从 1 开始；`pageSize` 服务端兜底并限制最大值，避免一次性拉取过量数据。
- 前端分页组件必须以服务端返回的 `total/page/pageSize` 为准，翻页、切换每页条数、切换主记录时需要重新请求接口。
- 需要整单提交的场景（例如教师批改整份答卷复核）不得只提交当前页数据，必须通过详情分页接口汇总全量后再提交，或后续升级为后端整单提交事务接口。

### 数据库级分页与权限过滤要求（2026-07-21）

对批改队列、成绩批次、成绩明细、答卷题目等数据增长型接口，分页必须优先下沉到 Repository/Pageable 层，不允许长期使用“查询全量后内存分页”作为企业级实现。权限过滤也应尽量进入查询条件：教师/助教只能访问其拥有全部班级权限的考试数据，管理员可访问全部数据。

自动化验收要求：新增分页接口时必须覆盖 `items/total/page/pageSize/totalPages/hasPrevious/hasNext` 元数据；当请求超大页码时，后端需要返回稳定页码而不是 500 或不可解释空页。

## Markdown 题库导入契约补充（2026-07-22）

- 接口：`POST /api/v1/questions/import/markdown`，仅 `ADMIN / TEACHER / TA` 可调用。
- 请求体：`courseId`、`markdown`、`fileName`。`markdown` 必须为 UTF-8 Markdown 文本，前端从 `.md` 文件读取后以 JSON 提交。
- 解析范围：支持 `exam/题库.md` 同类格式，包括 `**题号**（难度 知识点）` 题头、`A. / B. / C. / D.` 选项、`> **答案：**`、`> **参考答案要点**：`、`> **解析**：`、`> **评分标准**：`。
- 题型映射：优先按题号识别，单选、多选、判断、填空、简答、论述、程序阅读/补全、编程/接口设计分别写入 `QuestionType` 对应枚举；当题号未携带题型时再按章节标题兜底。
- 难度映射：`★/★★/★★★/★★★★/★★★★★` 映射到 5 级难度；Markdown 未标注时默认为 `MEDIUM`。
- 分值规则：优先使用题头 `分值：x 分`，其次使用章节标题 `每题 x 分`，否则默认为 2 分。
- 知识点规则：按照本轮需求，导入题目的 `knowledgePoints` 统一写为所选课程名称，不直接写入 Markdown 内部 `K1-1` 等标签。
- 去重规则：按 `courseId + title + type` 跳过重复题，返回 `parsedCount/importedCount/skippedCount/warnings`，避免重复导入同一份题库。

## 考试试卷交付与参考答案契约（2026-09-30）

### 学生答题试卷

| 接口 | 权限 | 规则 |
| --- | --- | --- |
| `GET /api/v1/student/exams/{examId}/paper` | 仅 `STUDENT` | 仅当前学生已分配且处于答题时间窗内的考试可读取；单选、多选选项按答卷随机，刷新稳定；不返回答案、解析、评分点。 |
| `GET /api/v1/papers/{paperId}` | `ADMIN/TEACHER/TA` | 教师侧试卷详情，不允许学生绕过答卷级随机化读取。 |
| `GET /api/v1/papers/{paperId}/questions` | `ADMIN/TEACHER/TA` | 教师侧已选题目分页接口，不允许学生读取。 |

学生在考试未开始或已结束时访问学生试卷接口，服务端返回冲突语义（HTTP `409`）；前端只能展示考试时间、须知和不可进入状态，不得提前下发题目。

### 教师参考答案

| 接口 | 权限 | 返回 |
| --- | --- | --- |
| `GET /api/v1/papers/{paperId}/answer-key` | `ADMIN/TEACHER/TA` | 题号、题干、分值、题库原始选项、标准答案、解析、评分点、知识点。 |

禁止：

1. 学生角色访问 `answer-key`。
2. 在学生试卷响应中返回 `answer`、`analysis`、`scoringPoints` 或答卷选项映射。
3. 学生通过通用 `/papers/**` 接口绕过随机选项顺序。

### 判分兼容要求

- 客观题自动判分前必须将学生提交的展示选项键还原为题库标准选项键。
- 多选题还原后按无序集合比较，避免展示顺序影响判分。
- 历史已保存答案但缺少随机映射的答卷按原顺序兼容，禁止重新随机后改变其答案语义。
