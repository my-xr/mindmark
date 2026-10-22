# 17 代码规范与 Lint 规范

## 1. 目标

本文档定义 MindMark 前端开发的代码规范、提交前检查和 lint 质量门禁。正式开发前，`apps/mindmark-web` 必须配置这些规则。

## 2. 基础原则

- 类型优先：能用类型约束的问题，不靠口头约定。
- 组件单一职责：页面负责编排，组件负责展示，composable 负责逻辑复用，service 负责数据访问。
- 文档一致：状态、字段、接口、权限必须与 docs 对齐。
- 可替换 Mock：Mock 数据不得散落在页面中。
- 企业级可维护：避免一次性 Demo 写法。

## 3. TypeScript 规范

### 3.1 tsconfig 必须开启

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 3.2 类型规则

- 禁止业务代码使用裸 `any`；确需使用时必须加注释说明。
- API 入参、响应、Mock 数据必须有显式类型。
- 枚举值优先使用字符串字面量联合或 `const enum` 风格常量对象。
- 不允许页面组件内重复定义领域类型。
- 所有状态值必须来源于 `types` 或 `constants`。

## 4. Vue 组件规范

- 使用 `<script setup lang="ts">`。
- 组件名使用 PascalCase。
- Props 必须定义类型，复杂 Props 抽到 `types`。
- Emits 必须定义事件签名。
- 页面组件只做编排，不写复杂业务算法。
- 组件超过 300 行应考虑拆分；页面超过 400 行必须拆分。

推荐顺序：

```vue
<script setup lang="ts">
// imports
// types
// props / emits
// state
// computed
// methods
// lifecycle
</script>

<template>
  <!-- template -->
</template>

<style scoped>
/* styles */
</style>
```

## 5. 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 文件夹 | kebab-case 或领域名 | `question-bank`、`teacher` |
| Vue 页面 | PascalCase + View | `QuestionBankView.vue` |
| Vue 组件 | PascalCase | `StatusTag.vue` |
| composable | use + PascalCase | `useExamTimer.ts` |
| service | camelCase + Service | `examService.ts` |
| store | use + PascalCase + Store | `useAuthStore.ts` |
| 类型文件 | camelCase / 领域名 | `question.ts` |
| 常量 | UPPER_SNAKE_CASE | `QUESTION_TYPE_OPTIONS` |
| 类型 / 接口 | PascalCase | `ExamStatus`、`Question` |

## 6. ESLint 规范

推荐使用 ESLint Flat Config，至少包含：

- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-vue`
- `eslint-plugin-import-x` 或等价 import 规则
- `eslint-config-prettier`

建议规则：

```js
export default [
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'error',
      'vue/no-v-html': 'warn'
    }
  }
]
```

## 7. Prettier 规范

推荐配置：

```js
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  endOfLine: 'lf'
};
```

## 8. Stylelint 规范

推荐用于约束 CSS / Less：

- 禁止无效颜色。
- 禁止重复选择器。
- 限制过深嵌套，建议最大 3 层。
- 允许 Ant Design Vue 相关变量和 CSS Modules 写法。

建议规则：

```js
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'max-nesting-depth': 3,
    'selector-class-pattern': null,
    'no-descending-specificity': null
  }
};
```

## 9. Import 规范

导入顺序：

1. Vue / 第三方库。
2. 项目别名导入：`@/types`、`@/services`、`@/components`。
3. 相对路径导入。
4. 样式导入。

禁止：

- 深层跨模块相对路径，例如 `../../../teacher/...`。
- 页面直接导入 `mock`。
- 循环依赖。

## 10. 路径别名

`vite.config.ts` 必须配置：

```ts
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  }
}
```

## 11. Git 与提交前检查

后续建立 Git 后建议配置：

- Husky
- lint-staged
- commitlint（Conventional Commits）

推荐提交格式：

```text
feat(web): add teacher dashboard shell
fix(exam): correct answer sheet status mapping
docs: update frontend architecture
refactor(question): split question renderer
```

## 12. package scripts 规范

`apps/mindmark-web/package.json` 至少包含：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc -b --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "stylelint": "stylelint \"src/**/*.{css,less,vue}\"",
    "quality": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm stylelint"
  }
}
```

根目录后续可提供聚合命令：

```json
{
  "scripts": {
    "web:dev": "pnpm --filter mindmark-web dev",
    "web:build": "pnpm --filter mindmark-web build",
    "web:quality": "pnpm --filter mindmark-web quality"
  }
}
```

## 13. 质量门禁

每次前端迭代结束必须至少执行或说明无法执行的原因：

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm stylelint`
- [ ] `pnpm build`

如果当前环境依赖尚未安装，则必须说明尚未安装依赖，并在下一步计划中补充安装和验证。

## 14. 禁止事项

- 禁止根目录业务 `src/`。
- 禁止页面直接访问 Mock 数据。
- 禁止在页面中硬编码大量状态文案和颜色。
- 禁止绕过 service 层直接调用接口。
- 禁止提交真实 API Key、账号密码、学生敏感数据。
- 禁止为了临时展示破坏类型约束或关闭 lint。
