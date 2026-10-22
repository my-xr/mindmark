<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';

import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PageSection from '@/components/common/PageSection.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import SummaryStrip from '@/components/common/SummaryStrip.vue';
import { listVisibleClasses } from '@/services/academicService';
import {
  downloadStudentRosterTemplate,
  importStudents,
  listClassStudentsPage,
  resetStudentPassword,
  type RosterImportResult,
  type StudentAccount,
  type StudentImportRow,
} from '@/services/studentAccountService';
import type { TeachingClass } from '@/types/academic';

const classes = ref<TeachingClass[]>([]);
const classId = ref('');
const csvText = ref(
  'studentNo,name,email,className,grade,major\n202601234569,王五,wangwu@example.com,软件工程 1 班,2026,软件工程',
);
const students = ref<StudentAccount[]>([]);
const importResult = ref<RosterImportResult | null>(null);
const loading = ref(false);
const importing = ref(false);
const errorMessage = ref<string | null>(null);
const operationMessage = ref<string | null>(null);
const resettingStudentId = ref<string | null>(null);
const studentPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const selectedClass = computed(
  () => classes.value.find((teachingClass) => teachingClass.id === classId.value) ?? null,
);
const className = computed(() => selectedClass.value?.name ?? '');
const parsedRows = computed(() => parseCsvRows(csvText.value));
const currentPageMustChangePasswordCount = computed(
  () => students.value.filter((student) => student.mustChangePassword).length,
);

const loadStudents = async (options: { resetPage?: boolean } = {}) => {
  if (options.resetPage) {
    studentPagination.page = 1;
  }
  if (!classId.value) {
    students.value = [];
    studentPagination.total = 0;
    return;
  }
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await listClassStudentsPage(
      classId.value,
      studentPagination.page,
      studentPagination.pageSize,
    );
    students.value = response.items;
    studentPagination.page = response.page;
    studentPagination.pageSize = response.pageSize;
    studentPagination.total = response.total;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '加载学生名单失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    classes.value = await listVisibleClasses();
    classId.value = classId.value || classes.value[0]?.id || '';
    if (classId.value) {
      const response = await listClassStudentsPage(classId.value, 1, studentPagination.pageSize);
      students.value = response.items;
      studentPagination.page = response.page;
      studentPagination.pageSize = response.pageSize;
      studentPagination.total = response.total;
    } else {
      students.value = [];
      studentPagination.total = 0;
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '基础数据或学生名单加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleDownloadTemplate = async () => {
  errorMessage.value = null;
  try {
    await downloadStudentRosterTemplate();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '下载导入模板失败，请稍后重试');
  }
};

const handleImport = async () => {
  errorMessage.value = null;
  operationMessage.value = null;
  if (!classId.value || !selectedClass.value) {
    errorMessage.value = '请先选择可管理的教学班';
    return;
  }
  if (parsedRows.value.length === 0) {
    errorMessage.value = '请粘贴至少一行学生数据';
    return;
  }

  importing.value = true;
  try {
    importResult.value = await importStudents(classId.value, className.value, parsedRows.value);
    operationMessage.value = `导入完成：新增 ${importResult.value.createdCount} 人，跳过重复 ${importResult.value.skippedCount} 人，失败 ${importResult.value.failedCount} 人。`;
    await loadStudents({ resetPage: true });
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '导入学生名单失败，请检查 CSV 内容');
  } finally {
    importing.value = false;
  }
};

const handleResetPassword = async (student: StudentAccount) => {
  const confirmed = await requestUserConfirmation({
    title: '重置学生密码',
    message: `确认将 ${student.name} 的密码重置为学号后 6 位，并要求下次登录修改密码？`,
    confirmText: '确认重置',
    tone: 'danger',
  });
  if (!confirmed) {
    return;
  }
  errorMessage.value = null;
  operationMessage.value = null;
  resettingStudentId.value = student.id;
  try {
    await resetStudentPassword(student.id);
    operationMessage.value = `${student.name} 的密码已重置，学生下次登录必须修改密码。`;
    await loadStudents();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '重置密码失败，请稍后重试');
  } finally {
    resettingStudentId.value = null;
  }
};

const handleClassChange = () => {
  void loadStudents({ resetPage: true });
};

const handleStudentPaginationChange = (page: number, pageSize: number) => {
  studentPagination.page = page;
  studentPagination.pageSize = pageSize;
  void loadStudents();
};
function parseCsvRows(text: string): StudentImportRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => !(index === 0 && line.toLowerCase().startsWith('studentno,')))
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((cells) => cells[0] && cells[1])
    .map((cells) => ({
      studentNo: cells[0],
      name: cells[1],
      email: cells[2] || null,
      className: cells[3] || className.value,
      grade: cells[4] || null,
      major: cells[5] || null,
    }));
}

onMounted(loadData);
</script>

<template>
  <div class="page-shell roster-page">
    <PageSection
      class="roster-import-card roster-import-card--refined"
      header-class="roster-section-title roster-import-title"
    >
      <template #title>
        <div class="roster-import-title-main">
          <span class="roster-import-icon" aria-hidden="true">👥</span>
          <div>
            <h2>名单导入</h2>
            <p class="muted-text">选择教学班并导入 CSV，系统自动创建学生账号并跳过重复学号。</p>
          </div>
        </div>
      </template>
      <template #actions>
        <span class="soft-tag roster-password-tag">初始密码：学号后 6 位</span>
        <AppActionButton
          class="icon-action-button"
          icon="⬇️"
          title="下载导入模板"
          @click="handleDownloadTemplate"
        >
          下载模板
        </AppActionButton>
      </template>

      <div class="roster-import-flow" aria-label="学生名单导入流程">
        <span><strong>1</strong> 下载模板</span>
        <span><strong>2</strong> 粘贴 CSV</span>
        <span><strong>3</strong> 导入并创建账号</span>
      </div>

      <div class="roster-import-layout">
        <div class="roster-class-panel roster-import-subcard">
          <div class="roster-subcard-heading">
            <span aria-hidden="true">🏫</span>
            <div>
              <strong>目标教学班</strong>
              <small>导入学生将归属到当前选择的教学班</small>
            </div>
          </div>
          <label class="form-field">
            教学班
            <select v-model="classId" class="select-input" @change="handleClassChange">
              <option value="">请选择教学班</option>
              <option
                v-for="teachingClass in classes"
                :key="teachingClass.id"
                :value="teachingClass.id"
              >
                {{ teachingClass.name }} / {{ teachingClass.code }}
              </option>
            </select>
          </label>

          <SummaryStrip
            v-if="selectedClass"
            class="roster-class-summary"
            eyebrow="当前班级"
            :title="selectedClass.name"
            :description="(selectedClass.grade || '-') + ' · ' + (selectedClass.major || '-')"
          >
            <small>ID：{{ classId }}</small>
          </SummaryStrip>
          <div v-else class="roster-class-summary roster-class-summary--empty">
            <span class="eyebrow-text">当前班级</span>
            <strong>暂无可见教学班</strong>
            <p>请先由管理员创建班级并完成教师/助教授权。</p>
          </div>
        </div>

        <div class="roster-csv-panel roster-import-subcard roster-import-subcard--csv">
          <div class="roster-subcard-heading">
            <span aria-hidden="true">📋</span>
            <div>
              <strong>CSV 学生名单</strong>
              <small>字段顺序：学号、姓名、邮箱、班级、年级、专业</small>
            </div>
          </div>
          <label class="form-field form-field--full roster-csv-field">
            粘贴 CSV 内容
            <textarea v-model="csvText" class="text-input roster-textarea" />
          </label>
          <div class="roster-import-hint-row">
            <p class="muted-text roster-import-tip">
              服务端会使用可信班级名称；导入内容中的 className 仅作兼容字段。
            </p>
            <span class="roster-count-pill">有效数据 {{ parsedRows.length }} 行</span>
          </div>
        </div>
      </div>

      <div class="roster-actions roster-actions--refined">
        <span class="roster-import-security">🔐 首次登录后学生必须修改密码</span>
        <AppActionButton
          icon="✨"
          variant="primary"
          :disabled="importing || !selectedClass"
          @click="handleImport"
        >
          {{ importing ? '导入中...' : '导入并创建账号' }}
        </AppActionButton>
      </div>
    </PageSection>

    <p v-if="operationMessage" class="operation-notice operation-notice--success">
      {{ operationMessage }}
    </p>
    <p v-if="errorMessage" class="operation-notice operation-notice--danger">{{ errorMessage }}</p>

    <section v-if="importResult?.errors.length" class="content-card roster-error-card">
      <h2>导入失败明细</h2>
      <div
        v-for="item in importResult.errors"
        :key="item.rowNumber + '-' + item.studentNo"
        class="roster-error-row"
      >
        <span>第 {{ item.rowNumber }} 行</span>
        <code>{{ item.studentNo || '-' }}</code>
        <strong>{{ item.message }}</strong>
      </div>
    </section>

    <PageSection
      class="roster-list-card"
      title="已导入学生"
      description="按当前教学班查看账号状态，教师/助教可重置学生密码。"
      header-class="roster-section-title"
    >
      <template #actions>
        <div class="roster-list-actions">
          <span class="soft-tag">共 {{ studentPagination.total }} 人</span>
          <span class="soft-tag">本页待改密 {{ currentPageMustChangePasswordCount }} 人</span>
          <AppActionButton
            class="icon-action-button"
            icon="↻"
            :disabled="loading || !selectedClass"
            title="刷新学生名单"
            @click="loadStudents()"
          >
            {{ loading ? '刷新中...' : '刷新' }}
          </AppActionButton>
        </div>
      </template>

      <ErrorState
        v-if="errorMessage && students.length === 0"
        title="学生名单加载失败"
        :description="errorMessage"
      />
      <div v-else class="student-account-table roster-account-table">
        <div class="student-account-row student-account-row--head">
          <span>学生</span>
          <span>学号/账号</span>
          <span>班级</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div v-for="student in students" :key="student.id" class="student-account-row">
          <span>
            <strong>{{ student.name }}</strong>
            <small>{{ student.email }}</small>
          </span>
          <span>{{ student.studentNo }}</span>
          <span>{{ student.className }}</span>
          <span>
            <StatusTag
              :label="student.mustChangePassword ? '待首次改密' : '正常'"
              :tone="student.mustChangePassword ? 'warning' : 'success'"
            />
          </span>
          <span>
            <AppActionButton
              :disabled="resettingStudentId === student.id"
              @click="handleResetPassword(student)"
            >
              {{ resettingStudentId === student.id ? '重置中...' : '重置密码' }}
            </AppActionButton>
          </span>
        </div>
        <div v-if="students.length === 0" class="student-account-empty">
          当前班级暂无学生，请先下载模板并导入名单。
        </div>
      </div>
      <EnterprisePagination
        v-if="studentPagination.total > studentPagination.pageSize"
        class="section-pagination roster-student-pagination"
        :current="studentPagination.page"
        :page-size="studentPagination.pageSize"
        :total="studentPagination.total"
        :page-size-options="['10', '20', '50', '100']"
        :disabled="loading"
        @change="handleStudentPaginationChange"
      />
    </PageSection>
  </div>
</template>
