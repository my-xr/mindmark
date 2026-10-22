# MindMark（明镜台）

MindMark 是面向院校 / 教师内部使用的智慧教考评一体化平台。当前阶段聚焦考试系统闭环：

```text
出题 → 组卷 → 开考 → 批改 → 出分 → 复盘
```

## 工程结构

```text
MindMark/
├─ docs/                 # 文档中心
├─ apps/
│  └─ mindmark-web/      # Phase 0/1 前端 Web 主项目
├─ packages/             # 共享包，后续按需创建
├─ infra/                # 基础设施配置，后续按需创建
└─ scripts/              # 项目脚本，后续按需创建
```

> 根目录是完整项目根目录，禁止直接在根目录创建业务 `src/`。

## 常用命令

```bash
pnpm install
pnpm web:dev
pnpm web:quality
pnpm web:build
pnpm server:compile
pnpm server:test
pnpm server:run
```

## 文档入口

请先阅读 `docs/README.md`。

## 后端与敏感配置

- 后端项目：`apps/mindmark-server`
- OpenAPI 静态契约：`apps/mindmark-server/openapi/mindmark-api.yaml`
- 本地 Swagger UI：`http://localhost:8080/swagger-ui/index.html`（仅在开启 OpenAPI 时可用）

本地启动默认连接 `localhost:5432/mindmark`、Redis `localhost:6379` 和 MinIO `localhost:9000`，完整环境变量示例见 `apps/mindmark-server/.env.example`。生产环境必须使用 `prod` profile，并注入独立的数据库、Redis、MinIO 凭据和 AI 加密密钥。任何 AI Provider Key 都只能通过教师个人配置或运行时环境变量注入，不能提交到仓库。
