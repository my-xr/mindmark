from pathlib import Path

p = Path('apps/mindmark-web/src/components/review/ReviewReportSelector.vue')
s = p.read_text(encoding='utf-8')
s = s.replace(
    "import EmptyState from '@/components/common/EmptyState.vue';",
    "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport EmptyState from '@/components/common/EmptyState.vue';",
)
s = s.replace(
    "const emit = defineEmits<{\n  select: [examId: string];\n}>();",
    "const emit = defineEmits<{\n  refresh: [];\n  select: [examId: string];\n}>();",
)
s = s.replace(
    """    >
      <EmptyState""",
    """    >
      <template #actions>
        <AppActionButton
          class=\"icon-action-button\"
          icon=\"↻\"
          :disabled=\"loading\"
          :title=\"loading ? '刷新中...' : '刷新复盘数据'\"
          @click=\"emit('refresh')\"
        >
          {{ loading ? '刷新中...' : '刷新' }}
        </AppActionButton>
      </template>
      <EmptyState""",
)
p.write_text(s, encoding='utf-8')

p = Path('apps/mindmark-web/src/views/teacher/ReviewsView.vue')
s = p.read_text(encoding='utf-8')
block = """    <div class=\"page-local-actions section-actions\">
      <AppActionButton
        class=\"icon-action-button\"
        icon=\"↻\"
        :disabled=\"loading\"
        :title=\"loading ? '刷新中...' : '刷新复盘数据'\"
        @click=\"loadData\"
      >
        {{ loading ? '刷新中...' : '刷新' }}
      </AppActionButton>
    </div>

"""
s = s.replace(block, '')
s = s.replace(
    "        @select=\"selectReport\"\n      />",
    "        @refresh=\"loadData\"\n        @select=\"selectReport\"\n      />",
)
p.write_text(s, encoding='utf-8')
