<script setup lang="ts">
import { onMounted, ref } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  getTeacherDashboardData,
  type TeacherDashboardMetric,
  type TeacherDashboardTask,
} from '@/services/dashboardService';
import { getErrorMessage } from '@/utils/errorMessage';

const quickActions = [
  {
    label: '题库管理',
    description: '维护题目、审核 AI 入库',
    to: '/teacher/questions',
    icon: '📚',
  },
  { label: '试卷与组卷', description: '调整试卷结构与分值', to: '/teacher/papers', icon: '🧩' },
  { label: '考试管理', description: '创建考试、查看入口', to: '/teacher/exams', icon: '🗓️' },
  { label: '批改中心', description: '复核答卷并汇总成绩', to: '/teacher/grading', icon: '✅' },
];

const metrics = ref<TeacherDashboardMetric[]>([]);
const tasks = ref<TeacherDashboardTask[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const loadDashboard = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const data = await getTeacherDashboardData();
    metrics.value = data.metrics;
    tasks.value = data.tasks;
  } catch (error) {
    metrics.value = [];
    tasks.value = [];
    errorMessage.value = getErrorMessage(error, '教师工作台数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

onMounted(loadDashboard);
</script>

<template>
  <div class="page-shell dashboard-page">
    <ErrorState v-if="errorMessage" title="工作台加载失败" :description="errorMessage">
      <AppActionButton class="icon-action-button" icon="↻" title="重试" @click="loadDashboard"
        >重试</AppActionButton
      >
    </ErrorState>

    <section v-else class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ loading ? '...' : metric.value }}</strong>
        <small>{{ metric.hint }}</small>
      </article>
      <template v-if="loading && !metrics.length">
        <article v-for="index in 4" :key="index" class="metric-card">
          <span>加载中</span>
          <strong>...</strong>
          <small>正在读取真实业务数据</small>
        </article>
      </template>
    </section>

    <div class="dashboard-main-grid">
      <section class="content-card dashboard-task-card">
        <div class="section-title">
          <div>
            <h2>近期待办</h2>
            <p class="muted-text">只展示需要教师立即关注的考试事项。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="↻"
              :disabled="loading"
              :title="loading ? '刷新中...' : '刷新数据'"
              @click="loadDashboard"
            >
              {{ loading ? '刷新中...' : '刷新数据' }}
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📅"
              title="查看考试"
              to="/teacher/exams"
            >
              查看考试
            </AppActionButton>
          </div>
        </div>
        <div v-if="tasks.length" class="task-list">
          <RouterLink
            v-for="task in tasks"
            :key="`${task.to}-${task.name}`"
            :to="task.to"
            class="task-item"
          >
            <span>
              <strong>{{ task.name }}</strong>
              <small>{{ task.meta }}</small>
            </span>
            <StatusTag :label="task.status" :tone="task.tone" />
          </RouterLink>
        </div>
        <EmptyState
          v-else
          title="暂无待办"
          description="当前没有进行中考试、待复核答卷、待发布成绩或待审核 AI 题目。"
        />
      </section>

      <section class="content-card dashboard-shortcut-card">
        <div class="section-title">
          <div>
            <h2>快捷入口</h2>
            <p class="muted-text">按考试闭环顺序进入核心页面。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✨"
              variant="primary"
              title="AI 出题"
              to="/teacher/ai-questions"
            >
              AI 出题
            </AppActionButton>
          </div>
        </div>
        <div class="dashboard-shortcut-list">
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            class="dashboard-shortcut-item"
            :to="action.to"
          >
            <span class="dashboard-shortcut-icon" aria-hidden="true">{{ action.icon }}</span>
            <span>
              <strong>{{ action.label }}</strong>
              <small>{{ action.description }}</small>
            </span>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
