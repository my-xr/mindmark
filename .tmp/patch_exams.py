from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/ExamsView.vue')
s = p.read_text(encoding='utf-8')
start = s.index('<script setup lang="ts">')
end = s.index('</script>') + len('</script>')
script = r'''<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { getErrorMessage } from '@/utils/errorMessage';

import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { EXAM_STATUS_META, PAPER_STATUS_META } from '@/constants/status';
import { listVisibleClasses } from '@/services/academicService';
import { createExam, listExams } from '@/services/examService';
import { listPapers } from '@/services/paperService';
import type { TeachingClass } from '@/types/academic';
import type { Exam, ExamCreateRequest } from '@/types/exam';
import type { Paper } from '@/types/paper';

interface ExamFormState {
  title: string;
  paperId: string;
  classIds: string[];
  startTime: string;
  endTime: string;
}

const pad = (value: number) => value.toString().padStart(2, '0');
const toDatetimeLocalValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;

const roundToNextMinutes = (date: Date, intervalMinutes = 10) => {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const rounded = Math.ceil(minutes / intervalMinutes) * intervalMinutes;
  next.setMinutes(rounded, 0, 0);

  return next;
};

const createDefaultForm = (): ExamFormState => {
  const start = roundToNextMinutes(new Date(Date.now() + 30 * 60 * 1000));
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  return {
    title: '前端工程化阶段测验',
    paperId: '',
    classIds: [],
    startTime: toDatetimeLocalValue(start),
    endTime: toDatetimeLocalValue(end),
  };
};

const exams = ref<Exam[]>([]);
const papers = ref<Paper[]>([]);
const classes = ref<TeachingClass[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const creating = ref(false);
const form = reactive<ExamFormState>(createDefaultForm());

const readyPapers = computed(() =>
  papers.value.filter((paper) => paper.status === 'READY' || paper.status === 'PUBLISHED'),
);
const selectedPaper = computed(
  () => papers.value.find((paper) => paper.id === form.paperId) ?? null,
);
const selectedClassNames = computed(() =>
  form.classIds
    .map((classId) => classes.value.find((teachingClass) => teachingClass.id === classId)?.name)
    .filter((name): name is string => Boolean(name)),
);
const durationMinutes = computed(() => {
  const start = new Date(form.startTime).getTime();
  const end = new Date(form.endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / 60000);
});
const durationHint = computed(() => {
  if (!durationMinutes.value) {
    return '请检查考试开始和结束时间';
  }

  const hours = Math.floor(durationMinutes.value / 60);
  const minutes = durationMinutes.value % 60;

  if (!hours) {
    return `${minutes} 分钟`;
  }

  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
});
const validationMessage = computed(() => {
  if (!form.title.trim()) {
    return '请填写考试名称';
  }
  if (!form.paperId) {
    return '请选择已准备或已发布的试卷';
  }
  if (!selectedPaper.value || !['READY', 'PUBLISHED'].includes(selectedPaper.value.status)) {
    return '当前试卷状态不可创建考试';
  }
  if (!form.classIds.length) {
    return '请选择至少一个参考班级';
  }
  if (!form.startTime || !form.endTime || durationMinutes.value <= 0) {
    return '结束时间必须晚于开始时间';
  }

  return '';
});
const canCreate = computed(() => !validationMessage.value);
const examStatusSummary = computed(() => [
  { label: '全部考试', value: exams.value.length },
  { label: '待开始', value: exams.value.filter((exam) => exam.status === 'SCHEDULED').length },
  { label: '进行中', value: exams.value.filter((exam) => exam.status === 'IN_PROGRESS').length },
  {
    label: '待批改',
    value: exams.value.filter((exam) => exam.status === 'ENDED' || exam.status === 'GRADING')
      .length,
  },
]);

const toRequestDateTime = (value: string) => value.replace('T', ' ');
const formatDateTimeText = (value: string) => value.replace('T', ' ');
const progressText = (exam: Exam) => `${exam.submittedCount}/${exam.participantCount}`;
const progressPercent = (exam: Exam) =>
  exam.participantCount ? Math.round((exam.submittedCount / exam.participantCount) * 100) : 0;

const isClassSelected = (classId: string) => form.classIds.includes(classId);

const toggleClassSelection = (classId: string) => {
  const index = form.classIds.indexOf(classId);
  if (index >= 0) {
    form.classIds.splice(index, 1);
    return;
  }
  form.classIds.push(classId);
};

const resetFormAfterCreate = () => {
  const next = createDefaultForm();
  form.title = next.title;
  form.startTime = next.startTime;
  form.endTime = next.endTime;
  form.paperId = readyPapers.value[0]?.id ?? '';
  form.classIds = classes.value[0]?.id ? [classes.value[0].id] : [];
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const [examResult, paperResult, classResult] = await Promise.all([
      listExams(),
      listPapers(),
      listVisibleClasses(),
    ]);
    exams.value = examResult;
    papers.value = paperResult;
    classes.value = classResult;
    form.paperId = form.paperId || readyPapers.value[0]?.id || '';
    form.classIds = form.classIds.length ? form.classIds : classResult[0]?.id ? [classResult[0].id] : [];
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '考试数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const submitCreateExam = async () => {
  successMessage.value = null;
  if (!canCreate.value) {
    errorMessage.value = validationMessage.value;
    return;
  }

  const request: ExamCreateRequest = {
    title: form.title.trim(),
    paperId: form.paperId,
    classIds: [...form.classIds],
    classNames: selectedClassNames.value.length ? selectedClassNames.value : [...form.classIds],
    startTime: toRequestDateTime(form.startTime),
    endTime: toRequestDateTime(form.endTime),
  };

  creating.value = true;
  errorMessage.value = null;
  try {
    exams.value = await createExam(request);
    successMessage.value = '考试创建成功，学生可在考试时间窗口内进入答题。';
    resetFormAfterCreate();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '创建考试失败，请检查试卷、班级与时间窗口');
  } finally {
    creating.value = false;
  }
};

const primaryAction = (exam: Exam) => {
  if (exam.status === 'ENDED' || exam.status === 'GRADING' || exam.status === 'GRADED') {
    return { label: '进入批改', to: '/teacher/grading' };
  }
  if (exam.status === 'PUBLISHED') {
    return { label: '查看复盘', to: '/teacher/reviews' };
  }

  return { label: '学生入口', to: `/student/exams/${exam.id}/notice` };
};

onMounted(() => {
  void loadData();
});
</script>'''
s = s[:start] + script + s[end:]
p.write_text(s, encoding='utf-8')
