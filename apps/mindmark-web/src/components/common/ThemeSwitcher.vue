<script setup lang="ts">
import { THEME_OPTIONS, type ThemeCode } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();

const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  appStore.setTheme(target.value as ThemeCode);
};
</script>

<template>
  <label class="theme-switcher" title="切换界面主题">
    <span>主题</span>
    <select :value="appStore.theme" aria-label="界面主题" @change="handleThemeChange">
      <option v-for="theme in THEME_OPTIONS" :key="theme.code" :value="theme.code">
        {{ theme.label }}
      </option>
    </select>
  </label>
</template>
