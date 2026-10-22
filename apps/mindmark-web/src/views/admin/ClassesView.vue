<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onMounted, reactive, ref } from 'vue';

import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import {
  createCourse,
  createCourseChapter,
  createTeachingClass,
  listAdminClasses,
  listAdminCourses,
  listCourseChapters,
  updateCourse,
  updateTeachingClass,
} from '@/services/academicService';
import type {
  AcademicStatus,
  Course,
  CourseChapter,
  CourseRequest,
  TeachingClass,
} from '@/types/academic';
import { getErrorMessage } from '@/utils/errorMessage';

const STATUS_OPTIONS: AcademicStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const STATUS_TONE: Record<AcademicStatus, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  DISABLED: 'warning',
  ARCHIVED: 'default',
};

const courses = ref<Course[]>([]);
const classes = ref<TeachingClass[]>([]);
const chapters = ref<CourseChapter[]>([]);
const selectedChapterCourseId = ref('');
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref<string | null>(null);
const operationMessage = ref<string | null>(null);
const editingCourseId = ref<string | null>(null);
const editingClassId = ref<string | null>(null);

const courseForm = reactive<CourseRequest>({
  code: '',
  name: '',
  description: '',
  status: 'ACTIVE',
});

const chapterForm = reactive({
  chapterNo: 1,
  title: '',
  description: '',
  status: 'ACTIVE' as AcademicStatus,
});

const classForm = reactive({
  courseId: '',
  code: '',
  name: '',
  grade: '2026',
  major: '',
  status: 'ACTIVE' as AcademicStatus,
});

const activeCourseCount = computed(
  () => courses.value.filter((course) => course.status === 'ACTIVE').length,
);
const activeClassCount = computed(
  () => classes.value.filter((teachingClass) => teachingClass.status === 'ACTIVE').length,
);

const resetCourseForm = () => {
  editingCourseId.value = null;
  Object.assign(courseForm, { code: '', name: '', description: '', status: 'ACTIVE' });
};

const loadChapters = async () => {
  if (!selectedChapterCourseId.value) {
    chapters.value = [];
    return;
  }
  chapters.value = await listCourseChapters(selectedChapterCourseId.value);
};

const submitChapter = async () => {
  if (!selectedChapterCourseId.value || !chapterForm.title.trim()) {
    errorMessage.value = '请选择课程并填写章节名称。';
    return;
  }
  saving.value = true;
  errorMessage.value = null;
  operationMessage.value = null;
  try {
    await createCourseChapter(selectedChapterCourseId.value, chapterForm);
    operationMessage.value = '课程章节已创建。';
    Object.assign(chapterForm, {
      chapterNo: Math.max(...chapters.value.map((chapter) => chapter.chapterNo), 0) + 1,
      title: '',
      description: '',
      status: 'ACTIVE',
    });
    await loadChapters();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '课程章节创建失败，请稍后重试。');
  } finally {
    saving.value = false;
  }
};

const resetClassForm = () => {
  editingClassId.value = null;
  Object.assign(classForm, {
    courseId: '',
    code: '',
    name: '',
    grade: '2026',
    major: '',
    status: 'ACTIVE',
  });
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const [courseResult, classResult] = await Promise.all([listAdminCourses(), listAdminClasses()]);
    courses.value = courseResult;
    classes.value = classResult;
    classForm.courseId = classForm.courseId || courseResult[0]?.id || '';
    selectedChapterCourseId.value = selectedChapterCourseId.value || courseResult[0]?.id || '';
    await loadChapters();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '基础数据加载失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const submitCourse = async () => {
  if (!courseForm.code.trim() || !courseForm.name.trim()) {
    errorMessage.value = '请填写课程编码和课程名称';
    return;
  }
  saving.value = true;
  errorMessage.value = null;
  operationMessage.value = null;
  try {
    if (editingCourseId.value) {
      await updateCourse(editingCourseId.value, courseForm);
      operationMessage.value = '课程已更新';
    } else {
      await createCourse(courseForm);
      operationMessage.value = '课程已创建';
    }
    resetCourseForm();
    await loadData();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '课程保存失败，请稍后重试。');
  } finally {
    saving.value = false;
  }
};

const editCourse = (course: Course) => {
  editingCourseId.value = course.id;
  Object.assign(courseForm, {
    code: course.code,
    name: course.name,
    description: course.description ?? '',
    status: course.status,
  });
};

const submitClass = async () => {
  if (!classForm.code.trim() || !classForm.name.trim()) {
    errorMessage.value = '请填写班级编码和班级名称';
    return;
  }
  saving.value = true;
  errorMessage.value = null;
  operationMessage.value = null;
  try {
    const payload = {
      ...classForm,
      courseId: classForm.courseId || null,
      grade: classForm.grade || null,
      major: classForm.major || null,
    };
    if (editingClassId.value) {
      await updateTeachingClass(editingClassId.value, payload);
      operationMessage.value = '班级已更新';
    } else {
      await createTeachingClass(payload);
      operationMessage.value = '班级已创建';
    }
    resetClassForm();
    await loadData();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '班级保存失败，请稍后重试。');
  } finally {
    saving.value = false;
  }
};

const editClass = (teachingClass: TeachingClass) => {
  editingClassId.value = teachingClass.id;
  Object.assign(classForm, {
    courseId: teachingClass.courseId ?? '',
    code: teachingClass.code,
    name: teachingClass.name,
    grade: teachingClass.grade ?? '',
    major: teachingClass.major ?? '',
    status: teachingClass.status,
  });
};

const handleChapterCourseChange = () => {
  void loadChapters();
};

onMounted(loadData);
</script>

<template>
  <div class="page-shell admin-classes-page">
    <PageHeader
      title="课程与班级"
      description="维护考试闭环的基础数据边界：课程、教学班和班级状态。教师授权、学生导入和考试创建都以真实班级为准。"
    >
      <template #actions>
        <AppActionButton data-testid="admin-classes-refresh" :disabled="loading" @click="loadData">
          {{ loading ? '刷新中...' : '刷新' }}
        </AppActionButton>
      </template>
    </PageHeader>

    <div class="overview-grid">
      <section class="content-card metric-card">
        <span class="muted-text">课程总数</span>
        <strong>{{ courses.length }}</strong>
        <small>启用 {{ activeCourseCount }}</small>
      </section>
      <section class="content-card metric-card">
        <span class="muted-text">班级总数</span>
        <strong>{{ classes.length }}</strong>
        <small>启用 {{ activeClassCount }}</small>
      </section>
      <section class="content-card metric-card">
        <span class="muted-text">权限边界</span>
        <strong>Class Scope</strong>
        <small>教师/助教仅可访问授权班级</small>
      </section>
    </div>

    <p v-if="operationMessage" class="operation-notice operation-notice--success">
      {{ operationMessage }}
    </p>
    <p v-if="errorMessage" class="operation-notice operation-notice--danger">{{ errorMessage }}</p>

    <ErrorState
      v-if="errorMessage && !courses.length && !classes.length"
      title="基础数据加载失败"
      :description="errorMessage"
    />

    <section class="content-card admin-section">
      <div class="section-title">
        <div>
          <h2>课程管理</h2>
          <p class="muted-text">课程用于归属班级；禁用/归档后不再作为新考试首选。</p>
        </div>
      </div>
      <div class="form-grid">
        <label class="form-field">
          课程编码
          <input
            v-model.trim="courseForm.code"
            data-testid="admin-course-code"
            class="text-input"
            placeholder="FE-2026"
          />
        </label>
        <label class="form-field">
          课程名称
          <input
            v-model.trim="courseForm.name"
            data-testid="admin-course-name"
            class="text-input"
            placeholder="course name"
          />
        </label>
        <label class="form-field">
          状态
          <select
            v-model="courseForm.status"
            data-testid="admin-course-status"
            class="select-input"
          >
            <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <label class="form-field form-field--full">
          课程说明
          <input
            v-model.trim="courseForm.description"
            data-testid="admin-course-description"
            class="text-input"
            placeholder="optional"
          />
        </label>
      </div>
      <div class="form-actions">
        <AppActionButton
          variant="primary"
          data-testid="admin-course-submit"
          :disabled="saving"
          @click="submitCourse"
        >
          {{ editingCourseId ? '保存课程' : '新增课程' }}
        </AppActionButton>
        <AppActionButton v-if="editingCourseId" @click="resetCourseForm">
          取消编辑
        </AppActionButton>
      </div>
      <div class="data-table">
        <div class="data-row data-row--course data-row--head">
          <span>课程</span>
          <span>编码</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div
          v-for="course in courses"
          :key="course.id"
          class="data-row data-row--course"
          data-testid="admin-course-row"
        >
          <span
            ><strong>{{ course.name }}</strong
            ><small>{{ course.description || '-' }}</small></span
          >
          <span>{{ course.code }}</span>
          <StatusTag :label="course.status" :tone="STATUS_TONE[course.status]" />
          <AppActionButton data-testid="admin-course-edit" @click="editCourse(course)">
            Edit
          </AppActionButton>
        </div>
      </div>
    </section>

    <section class="content-card admin-section">
      <div class="section-title">
        <div>
          <h2>课程章节管理</h2>
          <p class="muted-text">为课程维护章节目录，题库和组卷可按章节范围筛选。</p>
        </div>
      </div>
      <div class="form-grid">
        <label class="form-field">
          课程
          <select
            v-model="selectedChapterCourseId"
            class="select-input"
            @change="handleChapterCourseChange"
          >
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }} / {{ course.code }}
            </option>
          </select>
        </label>
        <label class="form-field">
          章节编号
          <input v-model.number="chapterForm.chapterNo" class="text-input" type="number" min="0" />
        </label>
        <label class="form-field">
          章节名称
          <input
            v-model.trim="chapterForm.title"
            class="text-input"
            placeholder="例如：第 1 章 JavaWeb 基础"
          />
        </label>
        <label class="form-field form-field--full">
          章节说明
          <input v-model.trim="chapterForm.description" class="text-input" placeholder="可选" />
        </label>
      </div>
      <div class="form-actions">
        <AppActionButton variant="primary" :disabled="saving" @click="submitChapter"
          >新增章节</AppActionButton
        >
      </div>
      <div class="data-table">
        <div class="data-row data-row--chapter data-row--head">
          <span>章节</span>
          <span>说明</span>
          <span>状态</span>
        </div>
        <div v-for="chapter in chapters" :key="chapter.id" class="data-row data-row--chapter">
          <span
            ><strong>第 {{ chapter.chapterNo }} 章 · {{ chapter.title }}</strong></span
          >
          <span>{{ chapter.description || '-' }}</span>
          <StatusTag :label="chapter.status" :tone="STATUS_TONE[chapter.status]" />
        </div>
      </div>
    </section>

    <section class="content-card admin-section">
      <div class="section-title">
        <div>
          <h2>教学班管理</h2>
          <p class="muted-text">学生账号归属、教师授权、考试创建均以教学班 ID 为准。</p>
        </div>
      </div>
      <div class="form-grid">
        <label class="form-field">
          归属课程
          <select
            v-model="classForm.courseId"
            data-testid="admin-class-course"
            class="select-input"
          >
            <option value="">不关联课程</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }} / {{ course.code }}
            </option>
          </select>
        </label>
        <label class="form-field">
          班级编码
          <input
            v-model.trim="classForm.code"
            data-testid="admin-class-code"
            class="text-input"
            placeholder="FE-2026-01"
          />
        </label>
        <label class="form-field">
          班级名称
          <input
            v-model.trim="classForm.name"
            data-testid="admin-class-name"
            class="text-input"
            placeholder="class name"
          />
        </label>
        <label class="form-field">
          年级
          <input
            v-model.trim="classForm.grade"
            data-testid="admin-class-grade"
            class="text-input"
            placeholder="2026"
          />
        </label>
        <label class="form-field">
          专业
          <input
            v-model.trim="classForm.major"
            data-testid="admin-class-major"
            class="text-input"
            placeholder="Software Engineering"
          />
        </label>
        <label class="form-field">
          状态
          <select v-model="classForm.status" data-testid="admin-class-status" class="select-input">
            <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <AppActionButton
          variant="primary"
          data-testid="admin-class-submit"
          :disabled="saving"
          @click="submitClass"
        >
          {{ editingClassId ? '保存班级' : '新增班级' }}
        </AppActionButton>
        <AppActionButton v-if="editingClassId" @click="resetClassForm"> 取消编辑 </AppActionButton>
      </div>
      <div class="data-table">
        <div class="data-row data-row--head">
          <span>班级</span>
          <span>课程</span>
          <span>年级/专业</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div
          v-for="teachingClass in classes"
          :key="teachingClass.id"
          class="data-row data-row--five"
          data-testid="admin-class-row"
        >
          <span
            ><strong>{{ teachingClass.name }}</strong
            ><small>{{ teachingClass.code }} / {{ teachingClass.id }}</small></span
          >
          <span>{{ teachingClass.courseName || '-' }}</span>
          <span>{{ teachingClass.grade || '-' }} / {{ teachingClass.major || '-' }}</span>
          <StatusTag :label="teachingClass.status" :tone="STATUS_TONE[teachingClass.status]" />
          <AppActionButton data-testid="admin-class-edit" @click="editClass(teachingClass)">
            Edit
          </AppActionButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-card strong {
  font-size: 24px;
}

.admin-section {
  margin-top: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.data-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.data-row {
  display: grid;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--mm-color-border);
}

.data-row--course {
  grid-template-columns: 2fr 1fr 1fr auto;
}

.data-row--chapter {
  grid-template-columns: 1.3fr 2fr 1fr;
}

.data-row--five {
  grid-template-columns: 2fr 1.3fr 1.2fr 1fr auto;
}

.data-row--head {
  color: var(--mm-color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.data-row small {
  display: block;
  margin-top: 4px;
  color: var(--mm-color-text-secondary);
}

@media (max-width: 960px) {
  .overview-grid,
  .data-row,
  .data-row--five {
    grid-template-columns: 1fr;
  }
}
</style>
