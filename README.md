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

## ??????

- ??????`apps/mindmark-server`
- ?? OpenAPI ???`apps/mindmark-server/openapi/mindmark-api.yaml`
- ??? Swagger UI?`http://localhost:8080/swagger-ui/index.html`

??????? Kimi API Key???????????????????
