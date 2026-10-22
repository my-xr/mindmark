export interface ApiResult<T> {
  code: 'OK' | string;
  message: string;
  data: T;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
