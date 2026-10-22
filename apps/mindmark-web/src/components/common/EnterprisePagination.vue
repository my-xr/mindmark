<script setup lang="ts">
import { nextTick, onMounted, onUpdated, ref } from 'vue';
import { Pagination as APagination } from 'ant-design-vue';

type PaginationRange = [number, number];

const props = withDefaults(
  defineProps<{
    current: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: string[];
    disabled?: boolean;
  }>(),
  {
    pageSizeOptions: () => ['10', '20', '50', '100'],
    disabled: false,
  },
);

const emit = defineEmits<{
  change: [page: number, pageSize: number];
}>();

const paginationRoot = ref<HTMLElement | null>(null);

const enhancePaginationAccessibility = () => {
  void nextTick(() => {
    const root = paginationRoot.value;
    if (!root) {
      return;
    }

    const labelMap: Array<[string, string]> = [
      ['.ant-pagination-prev .ant-pagination-item-link', '上一页'],
      ['.ant-pagination-next .ant-pagination-item-link', '下一页'],
      ['.ant-pagination-jump-prev .ant-pagination-item-link', '向前跳页'],
      ['.ant-pagination-jump-next .ant-pagination-item-link', '向后跳页'],
    ];

    for (const [selector, label] of labelMap) {
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (!element.getAttribute('aria-label')) {
          element.setAttribute('aria-label', label);
        }
        if (!element.getAttribute('title')) {
          element.setAttribute('title', label);
        }
      });
    }
  });
};

onMounted(enhancePaginationAccessibility);
onUpdated(enhancePaginationAccessibility);

const showTotal = (total: number, range: PaginationRange) =>
  `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`;

const handleChange = (page: number, pageSize: number) => {
  emit('change', page, pageSize);
};
</script>

<template>
  <div ref="paginationRoot" class="enterprise-pagination">
    <APagination
      :current="props.current"
      :page-size="props.pageSize"
      :total="props.total"
      :page-size-options="props.pageSizeOptions"
      :disabled="props.disabled"
      show-size-changer
      show-quick-jumper
      size="small"
      :show-total="showTotal"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.enterprise-pagination {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

:deep(.ant-pagination) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: var(--mm-color-text-secondary);
  font-size: 0.82rem;
}

:deep(.ant-pagination-total-text) {
  margin-inline-end: auto;
  color: var(--mm-color-text-secondary);
}

:deep(.ant-pagination-item),
:deep(.ant-pagination-prev),
:deep(.ant-pagination-next),
:deep(.ant-pagination-jump-prev),
:deep(.ant-pagination-jump-next) {
  min-width: 28px;
  height: 28px;
  margin-inline-end: 0;
  border-radius: var(--radius-sm, 6px);
  line-height: 26px;
}

:deep(.ant-pagination-item) {
  border-color: var(--mm-color-border);
  background: var(--mm-color-card);
}

:deep(.ant-pagination-item a) {
  color: var(--mm-color-text-secondary);
}

:deep(.ant-pagination-item-active) {
  border-color: var(--mm-color-primary);
  background: var(--mm-color-primary-soft);
}

:deep(.ant-pagination-item-active a) {
  color: var(--mm-color-primary);
  font-weight: 650;
}

:deep(.ant-pagination-options) {
  margin-inline-start: 4px;
}

:deep(.ant-select-selector),
:deep(.ant-pagination-options-quick-jumper input) {
  border-radius: var(--radius-sm, 6px) !important;
  border-color: var(--mm-color-border) !important;
  box-shadow: none !important;
}

:deep(.ant-select-focused .ant-select-selector),
:deep(.ant-pagination-options-quick-jumper input:focus) {
  border-color: color-mix(in srgb, var(--mm-color-primary) 58%, var(--mm-color-border)) !important;
}

@media (max-width: 720px) {
  .enterprise-pagination {
    justify-content: flex-start;
  }

  :deep(.ant-pagination) {
    justify-content: flex-start;
  }

  :deep(.ant-pagination-total-text) {
    flex-basis: 100%;
  }
}
</style>
