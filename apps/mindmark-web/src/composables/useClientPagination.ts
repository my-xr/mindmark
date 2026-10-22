import { computed, reactive, watch } from 'vue';

export interface ClientPaginationState {
  page: number;
  pageSize: number;
}

export const useClientPagination = <T>(source: () => readonly T[], initialPageSize = 10) => {
  const pagination = reactive<ClientPaginationState>({
    page: 1,
    pageSize: initialPageSize,
  });

  const total = computed(() => source().length);
  const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

  const items = computed(() => {
    const safePage = Math.min(Math.max(1, pagination.page), maxPage.value);
    const start = (safePage - 1) * pagination.pageSize;

    return source().slice(start, start + pagination.pageSize);
  });

  const clampPage = () => {
    pagination.page = Math.min(Math.max(1, pagination.page), maxPage.value);
  };

  const resetPage = () => {
    pagination.page = 1;
  };

  const handleChange = (page: number, pageSize: number) => {
    pagination.page = page;
    pagination.pageSize = pageSize;
    clampPage();
  };

  watch([total, () => pagination.pageSize], clampPage, { flush: 'sync' });

  return {
    pagination,
    total,
    items,
    resetPage,
    clampPage,
    handleChange,
  };
};
