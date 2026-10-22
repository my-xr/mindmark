const fs = require('fs');
const p = 'apps/mindmark-web/src/services/api/httpClient.ts';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
s = s.replace(
  "import axios, { AxiosError } from 'axios';",
  "import axios, { AxiosError, type AxiosRequestConfig } from 'axios';",
);
s = s.replace(
  "const message = error.response?.data?.message || error.message || '请求失败，请稍后重试';",
  "const rawMessage = error.response?.data?.message || error.message || '请求失败，请稍后重试';\n    const message = error.code === 'ECONNABORTED' || rawMessage.toLowerCase().includes('timeout')\n      ? '请求超时：AI 生成可能需要更长时间，请稍后重试或减少生成数量。'\n      : rawMessage;",
);
s = s.replace(
  "export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {\n  const response = await apiClient.post<ApiResponse<T>>(url, body);",
  "export async function apiPost<T, B = unknown>(\n  url: string,\n  body?: B,\n  config?: AxiosRequestConfig,\n): Promise<T> {\n  const response = await apiClient.post<ApiResponse<T>>(url, body, config);",
);
fs.writeFileSync(p, s, 'utf8');