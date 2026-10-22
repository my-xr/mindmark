const fs = require('fs');
const path = require('path');

const write = (p, s) => fs.writeFileSync(p, s.replace(/^\uFEFF/, ''), 'utf8');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');

for (const p of [
  'apps/mindmark-web/src/layouts/TeacherLayout.vue',
  'apps/mindmark-web/src/layouts/AdminLayout.vue',
  'apps/mindmark-web/src/layouts/StudentLayout.vue',
]) {
  let s = read(p);
  s = s.replace(/<ThemeSwitcher \/>`n\s*/g, '<ThemeSwitcher />\n          ');
  write(p, s);
}

// Dashboard: remove backend contract block from main teacher workspace.
write('apps/mindmark-web/src/views/teacher/DashboardView.vue', `<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';

const metrics = [
  { label: '题库题目', value: '1,248', hint: '覆盖 36 个知识点' },
  { label: '进行中考试', value: '3', hint: '含 1 场需要监控' },
  { label: '待复核答卷', value: '86', hint: 'AI 已完成预批改' },
  { label: '待发布成绩', value: '2', hint: '发布前检查待确认' },
];

const tasks = [
  { name: '《数据结构》期末模拟考试', meta: '今天 18:00 前完成主观题复核', status: '批改中', tone: 'warning' as const },
  { name: 'AI 生成题目审核：图论基础', meta: '建议优先处理高频知识点题目', status: '待审核', tone: 'info' as const },
  { name: '《Java 程序设计》成绩发布', meta: '发布前检查异常分与缺考名单', status: '待发布', tone: 'success' as const },
];

const quickActions = [
  { label: '题库管理', description: '维护题目、审核 AI 入库', to: '/teacher/questions', icon: '📚' },
  { label: '试卷与组卷', description: '调整试卷结构与分值', to: '/teacher/papers', icon: '🧩' },
  { label: '考试管理', description: '创建考试、查看入口', to: '/teacher/exams', icon: '🗓️' },
  { label: '批改中心', description: '复核答卷并汇总成绩', to: '/teacher/grading', icon: '✅' },
];
</script>

<template>
  <div class="dashboard-page">
    <PageHeader
      title="教师工作台"
      description="聚焦考试闭环关键任务，技术契约与低频说明已移出主工作区。"
    >
      <template #actions>
        <RouterLink class="primary-button" to="/teacher/ai-questions">AI 出题</RouterLink>
      </template>
    </PageHeader>

    <section class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.hint }}</small>
      </article>
    </section>

    <div class="dashboard-main-grid">
      <section class="content-card dashboard-task-card">
        <div class="section-title">
          <div>
            <h2>近期待办</h2>
            <p class="muted-text">只展示需要教师立即关注的考试事项。</p>
          </div>
          <RouterLink to="/teacher/exams">查看考试</RouterLink>
        </div>
        <div class="task-list">
          <div v-for="task in tasks" :key="task.name" class="task-item">
            <span>
              <strong>{{ task.name }}</strong>
              <small>{{ task.meta }}</small>
            </span>
            <StatusTag :label="task.status" :tone="task.tone" />
          </div>
        </div>
      </section>

      <section class="content-card dashboard-shortcut-card">
        <div class="section-title">
          <div>
            <h2>快捷入口</h2>
            <p class="muted-text">统一主操作位置，减少同屏说明。</p>
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
`);

const filterFiles = [
  {
    p: 'apps/mindmark-web/src/views/teacher/QuestionBankView.vue',
    replacements: [
      [`<p class="muted-text">当前共 {{ questions.length }} 道题；可展开细化检索条件。</p>`, `<p class="muted-text">默认展示首行条件；多行筛选可展开全部。</p>`],
      [`{{ isFilterCollapsed ? '展开筛选' : '收起筛选' }}`, `{{ isFilterCollapsed ? '展开全部' : '收起到一行' }}`],
      [`<div v-show="!isFilterCollapsed" class="filter-grid collapsible-filter-body">`, `<div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isFilterCollapsed },
        ]"
      >`],
    ],
  },
  {
    p: 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue',
    replacements: [
      [`{{ isGenerateCollapsed ? '展开配置' : '收起配置' }}`, `{{ isGenerateCollapsed ? '展开全部' : '收起到一行' }}`],
      [`<div v-show="!isGenerateCollapsed" class="filter-grid collapsible-filter-body">`, `<div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isGenerateCollapsed },
        ]"
      >`],
    ],
  },
  {
    p: 'apps/mindmark-web/src/views/teacher/ExamsView.vue',
    replacements: [
      [`{{ isCreatePanelCollapsed ? '展开创建' : '收起配置' }}`, `{{ isCreatePanelCollapsed ? '展开全部' : '收起到一行' }}`],
      [`<div v-show="!isCreatePanelCollapsed" class="filter-grid collapsible-filter-body">`, `<div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isCreatePanelCollapsed },
        ]"
      >`],
    ],
  },
  {
    p: 'apps/mindmark-web/src/components/admin/AdminUserSection.vue',
    replacements: [
      [`{{ isFilterCollapsed ? '展开筛选' : '收起筛选' }}`, `{{ isFilterCollapsed ? '展开全部' : '收起到一行' }}`],
      [`<div v-show="!isFilterCollapsed" class="admin-filter-grid collapsible-filter-body">`, `<div
      :class="[
        'admin-filter-grid',
        'collapsible-filter-body',
        { 'collapsible-filter-body--single-row': isFilterCollapsed },
      ]"
    >`],
    ],
  },
  {
    p: 'apps/mindmark-web/src/components/admin/AdminAuditSection.vue',
    replacements: [
      [`{{ isFilterCollapsed ? '展开筛选' : '收起筛选' }}`, `{{ isFilterCollapsed ? '展开全部' : '收起到一行' }}`],
      [`v-show="!isFilterCollapsed"\n      class="admin-filter-grid audit-filter-grid collapsible-filter-body"`, `:class="[
        'admin-filter-grid',
        'audit-filter-grid',
        'collapsible-filter-body',
        { 'collapsible-filter-body--single-row': isFilterCollapsed },
      ]"`],
    ],
  },
];

for (const { p, replacements } of filterFiles) {
  let s = read(p);
  for (const [from, to] of replacements) {
    if (!s.includes(from)) console.warn('missing replacement in', p, from.slice(0, 60));
    s = s.replace(from, to);
  }
  write(p, s);
}
