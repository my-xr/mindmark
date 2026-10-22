from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
text=text.replace("import { computed, onMounted, reactive, ref, watch } from 'vue';", "import { computed, h, onMounted, reactive, ref, watch } from 'vue';")
needle="""const questionDrawerTitle = computed(() => {
  if (isEditorMode.value) {
    return isCreatingQuestion.value ? '新增题目' : '编辑题目';
  }

  return '题目详情';
});
const questionTablePagination = computed(() => ({"""
insert="""const questionDrawerTitle = computed(() => {
  if (isEditorMode.value) {
    return isCreatingQuestion.value ? '新增题目' : '编辑题目';
  }

  return '题目详情';
});
const renderPaginationItem = (page: number, type: string, originalElement: unknown) => {
  if (type === 'page') {
    return originalElement;
  }

  const paginationActionMeta: Record<string, { label: string; text: string }> = {
    prev: { label: '上一页', text: '‹' },
    next: { label: '下一页', text: '›' },
    'jump-prev': { label: `跳转到第 ${Math.max(page, 1)} 页之前`, text: '…' },
    'jump-next': { label: `跳转到第 ${Math.max(page, 1)} 页之后`, text: '…' },
  };
  const meta = paginationActionMeta[type] ?? { label: '分页操作', text: '…' };

  return h(
    'button',
    {
      type: 'button',
      class: 'ant-pagination-item-link enterprise-pagination-action',
      'aria-label': meta.label,
      title: meta.label,
    },
    meta.text,
  );
};
const questionTablePagination = computed(() => ({"""
if needle not in text:
    raise SystemExit('needle not found')
text=text.replace(needle, insert)
old="""  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条 / 共 ${total} 道题`,
}));"""
new="""  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条 / 共 ${total} 道题`,
  itemRender: renderPaginationItem,
}));"""
if old not in text:
    raise SystemExit('pagination block not found')
text=text.replace(old,new)
p.write_text(text, encoding='utf-8')
