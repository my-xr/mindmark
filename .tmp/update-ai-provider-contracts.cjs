const fs = require('fs');

function replaceOrThrow(path, search, replacement) {
  const before = fs.readFileSync(path, 'utf8');
  if (!before.includes(search)) {
    throw new Error(`Pattern not found in ${path}: ${search.slice(0, 80)}`);
  }
  fs.writeFileSync(path, before.replace(search, replacement), 'utf8');
}

const openapiPath = 'apps/mindmark-server/openapi/mindmark-api.yaml';
replaceOrThrow(openapiPath, `  /api/v1/ai/provider-settings/kimi:
    get:
      tags: [AI]
      summary: Get current teacher Kimi provider setting
      description: Returns only masked key metadata; the plaintext API key is never returned.
      responses:
        '200':
          description: Kimi provider setting
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiProviderSettingApiResponse'
    put:
      tags: [AI]
      summary: Save current teacher Kimi API key
      description: Allowed for ADMIN, TEACHER and TA. API keys are encrypted at rest.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AiProviderSettingRequest'
      responses:
        '200':
          description: Saved Kimi provider setting
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiProviderSettingApiResponse'
  /api/v1/ai/questions/generate:
    post:
      tags: [AI]
      summary: Generate questions with LangGraph and Kimi, then persist drafts
      description: Resolves the teacher-specific Kimi key first, falls back to global environment config, runs validate_input -> resolve_course -> generate_with_kimi -> persist_questions, and writes generated questions as source=AI, status=PENDING_REVIEW.
`, `  /api/v1/ai/provider-settings:
    get:
      tags: [AI]
      summary: Get current teacher AI provider setting
      description: Returns masked key metadata for OpenAI or Anthropic; the plaintext API key is never returned. If provider is omitted, the server default provider is used.
      parameters:
        - name: provider
          in: query
          required: false
          schema:
            type: string
            enum: [OPENAI, ANTHROPIC]
            default: OPENAI
      responses:
        '200':
          description: AI provider setting
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiProviderSettingApiResponse'
    put:
      tags: [AI]
      summary: Save current teacher AI provider API key
      description: Allowed for ADMIN, TEACHER and TA. API keys are encrypted at rest and are only used by backend provider adapters.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AiProviderSettingRequest'
      responses:
        '200':
          description: Saved AI provider setting
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AiProviderSettingApiResponse'
  /api/v1/ai/questions/generate:
    post:
      tags: [AI]
      summary: Generate Chinese questions with LangGraph and OpenAI / Anthropic, then persist drafts
      description: Resolves the teacher-specific OpenAI or Anthropic key first, falls back to the matching global environment config, runs validate_input -> resolve_course -> generate_with_ai -> persist_questions, verifies Chinese title/options/analysis/scoring points, and writes generated questions as source=AI, status=PENDING_REVIEW.
`);
replaceOrThrow(openapiPath, `    AiProviderSettingRequest:
      type: object
      required: [apiKey]
      properties:
        apiKey:
          type: string
          writeOnly: true
          description: Plaintext Kimi API key submitted once and encrypted at rest.
    AiProviderSettingResponse:
      type: object
      properties:
        provider: { type: string, example: KIMI }
        configured: { type: boolean }
        keyPreview: { type: string, nullable: true, example: '***abcd' }
        updatedAt: { type: string, format: date-time, nullable: true }
`, `    AiProviderSettingRequest:
      type: object
      required: [provider, apiKey]
      properties:
        provider:
          type: string
          enum: [OPENAI, ANTHROPIC]
          description: AI provider selected by the teacher.
        apiKey:
          type: string
          writeOnly: true
          description: Plaintext OpenAI or Anthropic API key submitted once and encrypted at rest.
    AiProviderSettingResponse:
      type: object
      properties:
        provider: { type: string, enum: [OPENAI, ANTHROPIC], example: OPENAI }
        providerLabel: { type: string, example: OpenAI }
        configured: { type: boolean }
        keyPreview: { type: string, nullable: true, example: '****abcdef' }
        updatedAt: { type: string, format: date-time, nullable: true }
`);
replaceOrThrow(openapiPath, `    AiQuestionGenerateRequest:
      type: object
      required: [courseId, prompt, questionType, difficulty, count]
      properties:
        courseId: { type: string, description: Selected course id }
        prompt: { type: string }
        questionType: { $ref: '#/components/schemas/QuestionType' }
`, `    AiQuestionGenerateRequest:
      type: object
      required: [courseId, prompt, questionType, difficulty, count]
      properties:
        courseId: { type: string, description: Selected course id }
        provider: { type: string, enum: [OPENAI, ANTHROPIC], default: OPENAI }
        prompt: { type: string, description: Chinese generation prompt or selected course name }
        questionType: { $ref: '#/components/schemas/QuestionType' }
`);

const testPath = 'apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
replaceOrThrow(testPath, `.contains("/api/v1/ai/provider-settings/kimi:")
            .contains("/api/v1/ai/questions/generate:")
`, `.contains("/api/v1/ai/provider-settings:")
            .contains("/api/v1/ai/questions/generate:")
            .contains("providerLabel:")
            .contains("enum: [OPENAI, ANTHROPIC]")
            .contains("generate_with_ai")
            .contains("Chinese title/options/analysis/scoring points")
`);

const docsReplacements = [
  ['docs/10_AI能力与人工审核规范.md', '为后续 Kimi 接入预留审计链路。', '为后续真实 Provider 接入预留审计链路。'],
  ['docs/11_测试验收与质量门禁.md', '- OpenAI / Anthropic / Kimi API Key 仅允许通过教师个人加密配置或环境变量读取，不得提交到仓库。', '- OpenAI / Anthropic API Key 仅允许通过教师个人加密配置或环境变量读取，不得提交到仓库；Kimi 仅为讲评稿历史兼容 Provider。'],
  ['docs/11_测试验收与质量门禁.md', '- 默认不在自动化质量门禁中真实调用 Kimi 生成接口，避免产生非预期费用；如需验证真实模型调用，应由教师显式提供测试 Key 并确认可消耗额度。', '- 默认不在自动化质量门禁中真实调用 OpenAI / Anthropic 生成接口，避免产生非预期费用；如需验证真实模型调用，应由教师显式提供测试 Key 并确认可消耗额度。'],
  ['docs/15_工程架构与系统划分.md', '- PostgreSQL / Redis / Kimi Provider 的环境变量配置入口；', '- PostgreSQL / Redis / OpenAI / Anthropic Provider 的环境变量配置入口；'],
  ['docs/19_后端接口契约准备.md', '后续若引入真实 Kimi 调用，需要补充异步任务、失败重试、费用与模型输出审计字段。', '后续若引入或切换真实 OpenAI / Anthropic 调用，需要补充异步任务、失败重试、费用与模型输出审计字段。'],
  ['docs/20_后端系统框架设计.md', '- 用户本地提供的 OpenAI / Anthropic / Kimi API Key 仅允许通过教师个人加密配置、运行时环境变量或 `.env.local`（已被 `.gitignore` 忽略）注入，不能写入 `application.yml`、README、OpenAPI 或任何文档。', '- 用户本地提供的 OpenAI / Anthropic API Key 仅允许通过教师个人加密配置、运行时环境变量或 `.env.local`（已被 `.gitignore` 忽略）注入，不能写入 `application.yml`、README、OpenAPI 或任何文档；Kimi 仅作为讲评稿历史兼容配置保留。'],
  ['docs/21_考试闭环缺口分析与三轮收敛计划.md', '1. **OpenAI / Anthropic / Kimi API Key 不能明文写进代码或文档**，只能走教师个人加密配置、运行时环境变量或安全存储。', '1. **OpenAI / Anthropic API Key 不能明文写进代码或文档**，只能走教师个人加密配置、运行时环境变量或安全存储；Kimi 仅作为讲评稿历史兼容入口，不再作为 AI 出题主链路。'],
];
for (const [path, search, replacement] of docsReplacements) {
  replaceOrThrow(path, search, replacement);
}
