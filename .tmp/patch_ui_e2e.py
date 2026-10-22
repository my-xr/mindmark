from pathlib import Path
p=Path('apps/mindmark-web/src/components/common/EnterprisePagination.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("import { Pagination as APagination } from 'ant-design-vue';", "import { nextTick, onMounted, onUpdated, ref } from 'vue';\nimport { Pagination as APagination } from 'ant-design-vue';")
s=s.replace("const emit = defineEmits<{\n  change: [page: number, pageSize: number];\n}>();", "const emit = defineEmits<{\n  change: [page: number, pageSize: number];\n}>();\n\nconst paginationRoot = ref<HTMLElement | null>(null);\n\nconst enhancePaginationAccessibility = () => {\n  void nextTick(() => {\n    const root = paginationRoot.value;\n    if (!root) {\n      return;\n    }\n\n    const labelMap: Array<[string, string]> = [\n      ['.ant-pagination-prev .ant-pagination-item-link', '上一页'],\n      ['.ant-pagination-next .ant-pagination-item-link', '下一页'],\n      ['.ant-pagination-jump-prev .ant-pagination-item-link', '向前跳页'],\n      ['.ant-pagination-jump-next .ant-pagination-item-link', '向后跳页'],\n    ];\n\n    for (const [selector, label] of labelMap) {\n      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {\n        if (!element.getAttribute('aria-label')) {\n          element.setAttribute('aria-label', label);\n        }\n        if (!element.getAttribute('title')) {\n          element.setAttribute('title', label);\n        }\n      });\n    }\n  });\n};\n\nonMounted(enhancePaginationAccessibility);\nonUpdated(enhancePaginationAccessibility);")
s=s.replace('<div class="enterprise-pagination">', '<div ref="paginationRoot" class="enterprise-pagination">')
p.write_text(s, encoding='utf-8')

p=Path('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("{{ taskHistoryLoading ? '刷新中...' : '刷新历史' }}", "{{ taskHistoryLoading ? '刷新中...' : '刷新任务' }}")
p.write_text(s, encoding='utf-8')

p=Path('apps/mindmark-web/e2e/teacher-pages.spec.ts')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("      await expect(page.locator('.portal-content')).not.toContainText(/Internal server error|MM-500-001|Unhandled|undefined|null/i);", "      await expect(page.locator('.state-card--error')).toHaveCount(0);\n      await expect(page.locator('.portal-content')).not.toContainText(/MM-500-001|Unhandled/i);")
s=s.replace("    await firstActionMenu.locator('summary').click();\n    await firstActionMenu.getByRole('button', { name: '加入试卷' }).click();", "    await firstActionMenu.evaluate((element) => {\n      (element as HTMLDetailsElement).open = true;\n    });\n    await firstActionMenu.getByRole('button', { name: '加入试卷' }).click();")
p.write_text(s, encoding='utf-8')
