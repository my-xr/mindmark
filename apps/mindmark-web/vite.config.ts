import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) {
            return 'vendor-vue';
          }

          if (id.includes('ant-design-vue') || id.includes('@ant-design')) {
            return 'vendor-antd';
          }

          if (id.includes('echarts') || id.includes('vue-echarts')) {
            return 'vendor-echarts';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
