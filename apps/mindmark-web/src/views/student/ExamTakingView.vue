<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import ProgrammingCodeEditor from '@/components/exam/ProgrammingCodeEditor.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import QuestionRichText from '@/components/question/QuestionRichText.vue';
import QuestionTypeTag from '@/components/question/QuestionTypeTag.vue';
import {
  getExamById,
  saveAnswerDraft,
  startAnswerSheet,
  submitAnswerSheet,
} from '@/services/examService';
import { reportExamSecurityEvent } from '@/services/examSecurityAuditService';
import type { ExamSecurityEventType } from '@/types/audit';
import type { AnswerSheet, Exam, StudentAnswer } from '@/types/exam';
import type { PaperQuestion } from '@/types/paper';
import type { QuestionType } from '@/types/question';
import type { ProgrammingLanguage } from '@/types/programming';
import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';

const route = useRoute();
const router = useRouter();
const examId = computed(() => String(route.params.id));

const exam = ref<Exam | null>(null);
const sheet = ref<AnswerSheet | null>(null);
const currentIndex = ref(0);
const loading = ref(false);
const loadErrorMessage = ref<string | null>(null);
const operationMessage = ref<string | null>(null);
const operationTone = ref<'success' | 'warning' | 'danger'>('warning');
const saving = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const answerMap = ref<Record<string, string | string[]>>({});
const programmingLanguageMap = ref<Record<string, ProgrammingLanguage>>({});
const programmingLanguageStorageKey = computed(
  () => `mindmark:student-exam:${examId.value}:programming-languages`,
);
const isFullscreen = ref(false);
const hasEnteredFullscreen = ref(false);
const isLeavingExam = ref(false);
const remainingSeconds = ref(0);
const proctorEvents = ref<string[]>([]);
const proctorSubmitting = ref(false);
const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
const lastSavedAt = ref<string | null>(null);
const markedQuestionIds = ref<Set<string>>(new Set());
const isAnswerCardCollapsed = ref(false);
let countdownTimer: number | undefined;
let autosaveTimer: number | undefined;
let lastProctorEventAt = 0;

const paperQuestions = computed(() => exam.value?.paper.questions ?? []);
const currentItem = computed<PaperQuestion | null>(
  () => paperQuestions.value[currentIndex.value] ?? null,
);
const baseCanEdit = computed(() => exam.value?.status === 'IN_PROGRESS' && !submitted.value);
const fullscreenSupported = computed(
  () => typeof document !== 'undefined' && document.fullscreenEnabled !== false,
);
const canEdit = computed(
  () => baseCanEdit.value && (!fullscreenSupported.value || isFullscreen.value),
);
const fullscreenRequired = computed(
  () => baseCanEdit.value && fullscreenSupported.value && !isFullscreen.value,
);
const countdownText = computed(() => formatDuration(remainingSeconds.value));
const countdownTone = computed(() => {
  if (remainingSeconds.value <= 5 * 60) {
    return 'danger';
  }
  if (remainingSeconds.value <= 15 * 60) {
    return 'warning';
  }
  return 'success';
});
const answeredCount = computed(
  () => paperQuestions.value.filter((item) => hasAnswer(item.questionId)).length,
);
const remainingCount = computed(() =>
  Math.max(paperQuestions.value.length - answeredCount.value, 0),
);
const answeredPercent = computed(() => {
  if (!paperQuestions.value.length) {
    return 0;
  }
  return Math.round((answeredCount.value / paperQuestions.value.length) * 100);
});

const saveStateText = computed(() => {
  if (saveState.value === 'saving') {
    return '正在保存';
  }
  if (saveState.value === 'dirty') {
    return '有未保存修改';
  }
  if (saveState.value === 'error') {
    return '保存失败，请重试';
  }
  if (lastSavedAt.value) {
    return `已保存 ${lastSavedAt.value}`;
  }
  return '尚未作答';
});

const saveStateTone = computed(() => {
  if (saveState.value === 'error') {
    return 'danger';
  }
  if (saveState.value === 'dirty' || saveState.value === 'saving') {
    return 'warning';
  }
  if (saveState.value === 'saved') {
    return 'success';
  }
  return 'default';
});

const currentQuestionInstruction = computed(() => {
  const type = currentItem.value?.question.type;
  if (type === 'MULTIPLE_CHOICE') {
    return '可多选';
  }
  if (type === 'PROGRAMMING') {
    return '选择语言并完成代码';
  }
  if (type === 'SHORT_ANSWER' || type === 'ESSAY' || type === 'CASE_ANALYSIS') {
    return '建议分点作答';
  }
  if (type === 'FILL_BLANK') {
    return '填写答案';
  }
  return '选择一个答案';
});

const currentQuestionMarked = computed(() =>
  currentItem.value ? markedQuestionIds.value.has(currentItem.value.questionId) : false,
);

const formatSavedAt = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

const questionTypeOrder: QuestionType[] = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_BLANK',
  'SHORT_ANSWER',
  'ESSAY',
  'CASE_ANALYSIS',
  'PROGRAMMING',
];

const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: '\u5355\u9009\u9898',
  MULTIPLE_CHOICE: '\u591a\u9009\u9898',
  TRUE_FALSE: '\u5224\u65ad\u9898',
  FILL_BLANK: '\u586b\u7a7a\u9898',
  SHORT_ANSWER: '\u7b80\u7b54\u9898',
  ESSAY: '\u8bba\u8ff0\u9898',
  CASE_ANALYSIS: '\u6848\u4f8b\u5206\u6790',
  PROGRAMMING: '\u7f16\u7a0b\u9898',
};

const questionTypeShortLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: '\u5355',
  MULTIPLE_CHOICE: '\u591a',
  TRUE_FALSE: '\u5224',
  FILL_BLANK: '\u586b',
  SHORT_ANSWER: '\u7b80',
  ESSAY: '\u8bba',
  CASE_ANALYSIS: '\u6848',
  PROGRAMMING: '\u7a0b',
};

interface AnswerCardQuestionRef {
  item: PaperQuestion;
  index: number;
}

interface AnswerCardGroup {
  type: QuestionType;
  label: string;
  shortLabel: string;
  items: AnswerCardQuestionRef[];
  answeredCount: number;
  score: number;
}

const answerCardGroups = computed<AnswerCardGroup[]>(() =>
  questionTypeOrder
    .map((type) => {
      const items = paperQuestions.value
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.question.type === type);
      return {
        type,
        label: questionTypeLabels[type],
        shortLabel: questionTypeShortLabels[type],
        items,
        answeredCount: items.filter(({ item }) => hasAnswer(item.questionId)).length,
        score: items.reduce((sum, { item }) => sum + Number(item.score ?? 0), 0),
      };
    })
    .filter((group) => group.items.length > 0),
);

const questionNumberTypeClass = (type: QuestionType) =>
  `question-number-button--${type.toLowerCase()}`;

const programmingLanguages: ProgrammingLanguage[] = ['java', 'javascript', 'python', 'yml'];

const isProgrammingLanguage = (value: unknown): value is ProgrammingLanguage =>
  programmingLanguages.includes(value as ProgrammingLanguage);

const restoreProgrammingLanguages = () => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem(programmingLanguageStorageKey.value);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const restored = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => isProgrammingLanguage(value)),
    ) as Record<string, ProgrammingLanguage>;
    programmingLanguageMap.value = restored;
  } catch {
    programmingLanguageMap.value = {};
  }
};

const persistProgrammingLanguages = () => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      programmingLanguageStorageKey.value,
      JSON.stringify(programmingLanguageMap.value),
    );
  } catch {
    // localStorage may be unavailable in private or locked-down exam browsers.
  }
};

const parseExamTime = (value: string) => {
  const timestamp = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(seconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const restSeconds = safeSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(restSeconds)}`
    : `${pad(minutes)}:${pad(restSeconds)}`;
};

const updateCountdown = () => {
  if (!exam.value || submitted.value) {
    remainingSeconds.value = 0;
    return;
  }
  const endAt = parseExamTime(exam.value.endTime);
  remainingSeconds.value = Math.max(Math.ceil((endAt - Date.now()) / 1000), 0);
  if (baseCanEdit.value && remainingSeconds.value <= 0) {
    void autoSubmit(
      '\u8003\u8bd5\u65f6\u95f4\u5df2\u5230\uff0c\u7cfb\u7edf\u5df2\u81ea\u52a8\u4ea4\u5377',
    );
  }
};

const startCountdown = () => {
  window.clearInterval(countdownTimer);
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
};

const clearAutosaveTimer = () => {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = undefined;
  }
};

const markAnswerChanged = () => {
  if (!canEdit.value) {
    return;
  }

  saveState.value = 'dirty';
  clearAutosaveTimer();
  autosaveTimer = window.setTimeout(() => {
    void saveDraft(true);
  }, 1200);
};

const toggleCurrentQuestionMark = () => {
  if (!currentItem.value) {
    return;
  }

  const next = new Set(markedQuestionIds.value);
  if (next.has(currentItem.value.questionId)) {
    next.delete(currentItem.value.questionId);
  } else {
    next.add(currentItem.value.questionId);
  }
  markedQuestionIds.value = next;
};

const isMarked = (questionId: string) => markedQuestionIds.value.has(questionId);

const handleExamKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  const isEditing =
    target?.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target?.tagName ?? '');

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    void saveDraft();
    return;
  }

  if (isEditing || !canEdit.value) {
    return;
  }

  if (event.key === 'ArrowLeft' && currentIndex.value > 0) {
    event.preventDefault();
    jumpTo(currentIndex.value - 1);
  } else if (event.key === 'ArrowRight' && currentIndex.value < paperQuestions.value.length - 1) {
    event.preventDefault();
    jumpTo(currentIndex.value + 1);
  }
};

const refreshFullscreenState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

const requestExamFullscreen = async () => {
  if (!fullscreenSupported.value) {
    return;
  }
  try {
    await document.documentElement.requestFullscreen();
    hasEnteredFullscreen.value = true;
    refreshFullscreenState();
  } catch {
    operationTone.value = 'warning';
    operationMessage.value = '浏览器阻止了全屏请求，请重新点击“进入全屏答题”。';
  }
};

const reportSecurityEvent = (
  eventType: ExamSecurityEventType,
  message: string,
  clientEventCount = Math.max(proctorEvents.value.length, 1),
) => {
  if (!exam.value) {
    return;
  }

  void reportExamSecurityEvent(exam.value.id, {
    eventType,
    message,
    clientEventCount: Math.max(clientEventCount, 1),
    clientOccurredAt: new Date().toISOString(),
  }).catch((error: unknown) => {
    console.warn('Failed to report exam security event.', error);
  });
};

const recordProctorEvent = (eventType: ExamSecurityEventType, message: string) => {
  if (!baseCanEdit.value) {
    return;
  }
  const now = Date.now();
  if (now - lastProctorEventAt < 1500) {
    return;
  }
  lastProctorEventAt = now;
  const timeText = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  proctorEvents.value = [`${timeText} ${message}`, ...proctorEvents.value].slice(0, 5);
  reportSecurityEvent(eventType, message, proctorEvents.value.length);
  if (proctorEvents.value.length >= 3) {
    void autoSubmit(
      '\u68c0\u6d4b\u5230\u591a\u6b21\u5207\u5c4f\u6216\u9000\u51fa\u5168\u5c4f\uff0c\u7cfb\u7edf\u5df2\u81ea\u52a8\u4ea4\u5377',
    );
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    recordProctorEvent(
      'VISIBILITY_HIDDEN',
      '\u9875\u9762\u4e0d\u53ef\u89c1/\u7591\u4f3c\u5207\u5c4f',
    );
  }
};

const handleWindowBlur = () => {
  recordProctorEvent('WINDOW_BLUR', '\u7a97\u53e3\u5931\u7126/\u7591\u4f3c\u5207\u5c4f');
};

const handleFullscreenChange = () => {
  refreshFullscreenState();
  if (
    hasEnteredFullscreen.value &&
    baseCanEdit.value &&
    !isFullscreen.value &&
    !isLeavingExam.value
  ) {
    recordProctorEvent('FULLSCREEN_EXIT', '\u9000\u51fa\u5168\u5c4f\u7b54\u9898\u73af\u5883');
  }
};

const bindProctorListeners = () => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('blur', handleWindowBlur);
};

const cleanupProctorListeners = () => {
  window.clearInterval(countdownTimer);
  clearAutosaveTimer();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('blur', handleWindowBlur);
  window.removeEventListener('keydown', handleExamKeydown);
};

const autoSubmit = async (reason: string) => {
  if (!exam.value || submitted.value || proctorSubmitting.value) {
    return;
  }
  clearAutosaveTimer();
  proctorSubmitting.value = true;
  submitting.value = true;
  try {
    sheet.value = await submitAnswerSheet(exam.value.id, buildAnswers());
    submitted.value = true;
    saveState.value = 'saved';
    operationTone.value = 'success';
    operationMessage.value = reason;
  } catch (error) {
    operationTone.value = 'danger';
    operationMessage.value = getErrorMessage(
      error,
      '\u4ea4\u5377\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u8003\u8bd5\u4ecd\u5904\u4e8e\u7b54\u9898\u65f6\u95f4\u5185',
    );
  } finally {
    submitting.value = false;
    proctorSubmitting.value = false;
  }
};

const hasAnswer = (questionId: string) => {
  const answer = answerMap.value[questionId];
  return Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
};

const buildAnswers = (): StudentAnswer[] =>
  paperQuestions.value.map((item) => ({
    questionId: item.questionId,
    type: item.question.type,
    answer: answerMap.value[item.questionId] ?? '',
  }));

const jumpTo = (index: number) => {
  if (index >= 0 && index < paperQuestions.value.length) {
    currentIndex.value = index;
  }
};

const isOptionSelected = (questionId: string, key: string) => {
  const answer = answerMap.value[questionId];
  return Array.isArray(answer) ? answer.includes(key) : answer === key;
};

const answerText = (questionId: string) => {
  const answer = answerMap.value[questionId];
  return Array.isArray(answer) ? answer.join(', ') : (answer ?? '');
};

const setSingleAnswer = (questionId: string, value: string) => {
  if (!canEdit.value) {
    return;
  }
  answerMap.value = { ...answerMap.value, [questionId]: value };
  markAnswerChanged();
};

const toggleMultipleAnswer = (questionId: string, key: string) => {
  if (!canEdit.value) {
    return;
  }
  const current = answerMap.value[questionId];
  const next = Array.isArray(current) ? [...current] : [];
  const index = next.indexOf(key);
  if (index >= 0) {
    next.splice(index, 1);
  } else {
    next.push(key);
  }
  answerMap.value = { ...answerMap.value, [questionId]: next };
  markAnswerChanged();
};

const setTextAnswerValue = (questionId: string, value: string) => {
  if (!canEdit.value) {
    return;
  }
  answerMap.value = { ...answerMap.value, [questionId]: value };
  markAnswerChanged();
};

const setTextAnswer = (questionId: string, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  setTextAnswerValue(questionId, target.value);
};

const setProgrammingLanguage = (questionId: string, language: ProgrammingLanguage) => {
  programmingLanguageMap.value = { ...programmingLanguageMap.value, [questionId]: language };
};

const hydrateAnswers = (answers: StudentAnswer[]) => {
  answerMap.value = answers.reduce<Record<string, string | string[]>>((result, item) => {
    result[item.questionId] = item.answer;
    return result;
  }, {});
};

const saveDraft = async (silent = false) => {
  if (!exam.value || !canEdit.value) {
    return;
  }
  if (saving.value) {
    return;
  }
  clearAutosaveTimer();
  saving.value = true;
  saveState.value = 'saving';
  if (!silent) {
    operationMessage.value = null;
  }
  try {
    sheet.value = await saveAnswerDraft(exam.value.id, buildAnswers());
    saveState.value = 'saved';
    lastSavedAt.value = formatSavedAt();
    if (!silent) {
      operationTone.value = 'success';
      operationMessage.value = '草稿已保存，系统已记录本次答题进度。';
    }
  } catch (error) {
    saveState.value = 'error';
    if (!silent) {
      operationTone.value = 'danger';
      operationMessage.value = getErrorMessage(
        error,
        '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u8003\u8bd5\u4ecd\u5904\u4e8e\u7b54\u9898\u65f6\u95f4\u5185',
      );
    }
  } finally {
    saving.value = false;
  }
};

const submit = async () => {
  if (!exam.value || !canEdit.value) {
    return;
  }
  const confirmed = await requestUserConfirmation('确认交卷？交卷后将不能继续修改答案。');
  if (!confirmed) {
    return;
  }
  clearAutosaveTimer();
  submitting.value = true;
  operationMessage.value = null;
  try {
    sheet.value = await submitAnswerSheet(exam.value.id, buildAnswers());
    submitted.value = true;
    saveState.value = 'saved';
  } catch (error) {
    operationTone.value = 'danger';
    operationMessage.value = getErrorMessage(
      error,
      '\u4ea4\u5377\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u8003\u8bd5\u4ecd\u5904\u4e8e\u7b54\u9898\u65f6\u95f4\u5185',
    );
  } finally {
    submitting.value = false;
  }
};

const returnToExamCenter = async () => {
  if (baseCanEdit.value) {
    const confirmed = await requestUserConfirmation({
      title: '确认返回考试中心？',
      message: '返回后不会自动交卷，已保存的草稿仍会保留。',
      confirmText: '返回考试中心',
      cancelText: '继续答题',
    });
    if (!confirmed) {
      return;
    }
  }

  if (canEdit.value && saveState.value === 'dirty') {
    await saveDraft(true);
  }

  isLeavingExam.value = true;
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  }
  await router.push('/student/exams');
};

const loadExam = async () => {
  loading.value = true;
  loadErrorMessage.value = null;
  operationMessage.value = null;
  try {
    exam.value = (await getExamById(examId.value, { student: true })) ?? null;
    if (exam.value) {
      sheet.value = await startAnswerSheet(exam.value.id);
      submitted.value = sheet.value.status === 'SUBMITTED';
      hydrateAnswers(sheet.value.answers);
      if ((sheet.value.version ?? 0) > 0) {
        saveState.value = 'saved';
      }
    }
  } catch (error) {
    exam.value = null;
    sheet.value = null;
    loadErrorMessage.value = getErrorMessage(
      error,
      '\u8003\u8bd5\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
    );
  } finally {
    loading.value = false;
  }
};

watch(programmingLanguageMap, persistProgrammingLanguages, { deep: true });

onMounted(async () => {
  restoreProgrammingLanguages();
  await loadExam();
  startCountdown();
  bindProctorListeners();
  refreshFullscreenState();
  window.addEventListener('keydown', handleExamKeydown);
});

onBeforeUnmount(() => {
  cleanupProctorListeners();
});
</script>

<template>
  <div class="page-shell taking-page">
    <section
      v-if="exam"
      class="exam-taking-topbar exam-taking-topbar--focused"
      aria-label="考试状态栏"
    >
      <div class="exam-taking-heading-zone">
        <AppActionButton
          v-if="!submitted"
          class="exam-return-center-action icon-action-button"
          size="sm"
          icon="←"
          icon-only
          aria-label="返回考试中心"
          title="返回考试中心"
          variant="secondary"
          @click="returnToExamCenter"
        />
        <div class="exam-taking-title-block">
          <h1>{{ exam.title }}</h1>
        </div>
      </div>

      <div
        class="exam-taking-control-zone"
        :class="{ 'exam-taking-control-zone--submitted': submitted }"
      >
        <div v-if="submitted" class="exam-submitted-state" aria-label="交卷状态" aria-live="polite">
          <i aria-hidden="true" />
          <strong>已交卷</strong>
        </div>

        <template v-else>
          <div :class="['exam-save-state', `exam-save-state--${saveStateTone}`]" aria-live="polite">
            <i aria-hidden="true" />
            <span>{{ saveStateText }}</span>
          </div>

          <AppActionButton
            v-if="baseCanEdit"
            class="exam-fullscreen-action"
            icon="⛶"
            variant="primary"
            :disabled="!fullscreenRequired"
            @click="requestExamFullscreen"
          >
            {{
              fullscreenRequired
                ? '\u8fdb\u5165\u5168\u5c4f\u7b54\u9898'
                : '\u5df2\u8fdb\u5165\u5168\u5c4f'
            }}
          </AppActionButton>

          <details v-if="baseCanEdit" class="exam-guard-details">
            <summary>
              <span
                >考试监考 · {{ fullscreenRequired ? '\u672a\u5168\u5c4f' : '\u6b63\u5e38' }}</span
              >
              <b>{{ proctorEvents.length }}/3</b>
            </summary>
            <div class="exam-guard-panel">
              <div class="exam-guard-panel__head">
                <StatusTag
                  :label="
                    fullscreenRequired ? '\u9700\u8981\u5168\u5c4f' : '\u72b6\u6001\u6b63\u5e38'
                  "
                  :tone="fullscreenRequired ? 'warning' : 'success'"
                />
                <span>异常 {{ proctorEvents.length }}/3</span>
              </div>
              <p>考试期间请保持全屏。切屏、失焦或退出全屏会被记录，多次异常将触发自动交卷。</p>
              <AppActionButton
                class="full-width"
                variant="primary"
                :disabled="!fullscreenRequired"
                @click="requestExamFullscreen"
              >
                {{
                  fullscreenRequired
                    ? '\u8fdb\u5165\u5168\u5c4f\u7b54\u9898'
                    : '\u5df2\u8fdb\u5165\u5168\u5c4f'
                }}
              </AppActionButton>
              <ul v-if="proctorEvents.length" class="proctor-event-list exam-guard-events">
                <li v-for="event in proctorEvents" :key="event">{{ event }}</li>
              </ul>
            </div>
          </details>

          <div
            :class="['exam-timer-chip', `exam-timer-chip--${countdownTone}`]"
            aria-label="倒计时"
          >
            <strong>{{ countdownText }}</strong>
          </div>
        </template>
      </div>
    </section>

    <p v-if="loading" class="muted-text loading-text">正在进入考试...</p>
    <ErrorState v-else-if="loadErrorMessage" title="考试加载失败" :description="loadErrorMessage">
      <AppActionButton @click="loadExam">重试</AppActionButton>
    </ErrorState>
    <EmptyState v-else-if="!exam" title="考试不存在" description="请返回考试中心重新选择考试。" />

    <section v-else-if="submitted && sheet" class="content-card submit-result-card">
      <StatusTag label="已交卷" tone="success" />
      <h1>答卷已提交</h1>
      <p class="muted-text">
        {{ exam.title }} &#24050;&#20110;
        {{ sheet.submittedAt ?? '\u5f53\u524d\u65f6\u95f4' }}
        &#25552;&#20132;&#65292;&#31995;&#32479;&#24050;&#36827;&#20837;&#25209;&#25913;&#27969;&#31243;&#12290;
      </p>
      <p
        v-if="operationMessage"
        :class="['operation-notice', `operation-notice--${operationTone}`]"
      >
        {{ operationMessage }}
      </p>
      <AppActionButton variant="primary" to="/student/exams">返回考试中心</AppActionButton>
    </section>

    <template v-else>
      <section v-if="!baseCanEdit" class="content-card operation-notice operation-notice--warning">
        <StatusTag label="当前不可答题" tone="warning" />
        <p class="muted-text">当前考试状态为 {{ exam.status }}，仅在考试进行中可继续作答。</p>
      </section>

      <p
        v-if="operationMessage"
        :class="['operation-notice', `operation-notice--${operationTone}`]"
      >
        {{ operationMessage }}
      </p>

      <section v-if="fullscreenRequired" class="exam-fullscreen-gate" aria-label="全屏作答提示">
        <span class="exam-fullscreen-gate__icon" aria-hidden="true">⛶</span>
        <div>
          <strong>请先进入全屏后开始作答</strong>
          <p>答题控件已暂时锁定。请点击右上角“进入全屏答题”，进入全屏后即可继续。</p>
        </div>
      </section>

      <section
        class="exam-taking-progress-strip exam-taking-progress-strip--focused"
        aria-label="答题概览"
      >
        <div class="exam-taking-progress-text">
          <strong>已答 {{ answeredCount }} / {{ paperQuestions.length }} 题</strong>
          <span>还剩 {{ remainingCount }} 题</span>
        </div>
        <div class="taking-progress-meter" aria-label="答题进度">
          <i :style="{ width: `${answeredPercent}%` }" />
        </div>
      </section>

      <main :class="['taking-shell', { 'taking-shell--fullscreen-locked': fullscreenRequired }]">
        <section v-if="currentItem" class="question-card taking-question-panel">
          <div class="taking-question-header">
            <div>
              <div class="taking-question-kicker">
                <span>第 {{ currentIndex + 1 }} 题</span>
                <QuestionTypeTag :type="currentItem.question.type" />
              </div>
              <h2>{{ currentQuestionInstruction }}</h2>
            </div>
            <div class="taking-question-tools">
              <span class="question-score-badge">{{ currentItem.score }} 分</span>
              <button
                class="question-mark-button"
                type="button"
                :class="{ 'question-mark-button--active': currentQuestionMarked }"
                :aria-pressed="currentQuestionMarked"
                @click="toggleCurrentQuestionMark"
              >
                <span aria-hidden="true">{{ currentQuestionMarked ? '★' : '☆' }}</span>
                {{ currentQuestionMarked ? '已标记' : '标记检查' }}
              </button>
            </div>
          </div>

          <QuestionRichText
            class="taking-question-title"
            :text="currentItem.question.title"
            tone="title"
          />

          <div v-if="currentItem.question.type === 'SINGLE_CHOICE'" class="option-list">
            <label
              v-for="option in currentItem.question.options"
              :key="option.key"
              :class="[
                'option-item',
                { 'option-item--selected': isOptionSelected(currentItem.questionId, option.key) },
              ]"
            >
              <input
                :name="currentItem.questionId"
                type="radio"
                :disabled="!canEdit"
                :checked="isOptionSelected(currentItem.questionId, option.key)"
                @change="setSingleAnswer(currentItem.questionId, option.key)"
              />
              <span>{{ option.key }}. {{ option.content }}</span>
            </label>
          </div>

          <div v-else-if="currentItem.question.type === 'MULTIPLE_CHOICE'" class="option-list">
            <label
              v-for="option in currentItem.question.options"
              :key="option.key"
              :class="[
                'option-item',
                { 'option-item--selected': isOptionSelected(currentItem.questionId, option.key) },
              ]"
            >
              <input
                type="checkbox"
                :disabled="!canEdit"
                :checked="isOptionSelected(currentItem.questionId, option.key)"
                @change="toggleMultipleAnswer(currentItem.questionId, option.key)"
              />
              <span>{{ option.key }}. {{ option.content }}</span>
            </label>
          </div>

          <div v-else-if="currentItem.question.type === 'TRUE_FALSE'" class="option-list">
            <label
              :class="[
                'option-item',
                { 'option-item--selected': isOptionSelected(currentItem.questionId, 'True') },
              ]"
            >
              <input
                :name="currentItem.questionId"
                type="radio"
                :disabled="!canEdit"
                :checked="isOptionSelected(currentItem.questionId, 'True')"
                @change="setSingleAnswer(currentItem.questionId, 'True')"
              />
              <span>正确</span>
            </label>
            <label
              :class="[
                'option-item',
                { 'option-item--selected': isOptionSelected(currentItem.questionId, 'False') },
              ]"
            >
              <input
                :name="currentItem.questionId"
                type="radio"
                :disabled="!canEdit"
                :checked="isOptionSelected(currentItem.questionId, 'False')"
                @change="setSingleAnswer(currentItem.questionId, 'False')"
              />
              <span>错误</span>
            </label>
          </div>

          <input
            v-else-if="currentItem.question.type === 'FILL_BLANK'"
            class="text-input answer-input"
            type="text"
            placeholder="请输入答案"
            :disabled="!canEdit"
            :value="answerText(currentItem.questionId)"
            @input="setTextAnswer(currentItem.questionId, $event)"
          />

          <ProgrammingCodeEditor
            v-else-if="currentItem.question.type === 'PROGRAMMING'"
            :model-value="answerText(currentItem.questionId)"
            :disabled="!canEdit"
            :question-id="currentItem.questionId"
            :language="programmingLanguageMap[currentItem.questionId] ?? 'java'"
            @update:model-value="setTextAnswerValue(currentItem.questionId, $event)"
            @language-change="setProgrammingLanguage(currentItem.questionId, $event)"
          />

          <textarea
            v-else
            class="textarea-input answer-textarea"
            rows="8"
            placeholder="请输入作答内容，建议分点说明关键步骤。"
            :disabled="!canEdit"
            :value="answerText(currentItem.questionId)"
            @input="setTextAnswer(currentItem.questionId, $event)"
          />

          <div class="taking-actions">
            <AppActionButton :disabled="currentIndex === 0" @click="jumpTo(currentIndex - 1)">
              ← 上一题
            </AppActionButton>
            <AppActionButton
              :disabled="currentIndex === paperQuestions.length - 1"
              @click="jumpTo(currentIndex + 1)"
            >
              下一题 →
            </AppActionButton>
            <AppActionButton variant="primary" :disabled="saving || !canEdit" @click="saveDraft()">
              {{ saving ? '\u4fdd\u5b58\u4e2d...' : '\u4fdd\u5b58\u8349\u7a3f' }}
            </AppActionButton>
          </div>
        </section>

        <aside class="question-card answer-card-panel">
          <div class="answer-card-header">
            <div class="answer-card-heading">
              <div>
                <strong>答题卡</strong>
                <p class="muted-text">按题型导航，标记需要回看的题目。</p>
              </div>
              <span class="answer-card-percent">{{ answeredPercent }}%</span>
            </div>
            <button
              class="answer-card-collapse"
              type="button"
              :aria-expanded="!isAnswerCardCollapsed"
              @click="isAnswerCardCollapsed = !isAnswerCardCollapsed"
            >
              <span>{{ isAnswerCardCollapsed ? '展开答题卡' : '收起答题卡' }}</span>
              <span aria-hidden="true">{{ isAnswerCardCollapsed ? '⌄' : '⌃' }}</span>
            </button>
          </div>

          <div
            v-if="!isAnswerCardCollapsed"
            class="answer-card-type-groups"
            aria-label="按题型分组的答题卡"
          >
            <section
              v-for="group in answerCardGroups"
              :key="group.type"
              :class="[
                'answer-card-type-group',
                `answer-card-type-group--${group.type.toLowerCase()}`,
              ]"
            >
              <div class="answer-card-type-title">
                <span>
                  <i>{{ group.shortLabel }}</i>
                  {{ group.label }}
                </span>
                <em
                  >{{ group.answeredCount }}/{{ group.items.length }} &#39064; &#183;
                  {{ group.score }} &#20998;</em
                >
              </div>
              <div class="question-number-grid question-number-grid--typed">
                <button
                  v-for="{ item, index } in group.items"
                  :key="item.id"
                  :class="[
                    'question-number-button',
                    questionNumberTypeClass(item.question.type),
                    {
                      active: index === currentIndex,
                      answered: hasAnswer(item.questionId),
                      marked: isMarked(item.questionId),
                    },
                  ]"
                  type="button"
                  :title="`${group.label} 第 ${index + 1} 题${isMarked(item.questionId) ? ' · 已标记检查' : ''}`"
                  @click="jumpTo(index)"
                >
                  {{ index + 1 }}
                </button>
              </div>
            </section>
          </div>

          <div v-if="!isAnswerCardCollapsed" class="taking-progress answer-card-summary">
            <span>已答 {{ answeredCount }}/{{ paperQuestions.length }}</span>
            <span>待检查 {{ markedQuestionIds.size }}</span>
            <span>总分 {{ exam.paper.totalScore }}</span>
          </div>
          <AppActionButton
            class="full-width answer-card-submit-action"
            variant="primary"
            :disabled="submitting || !canEdit"
            @click="submit"
          >
            {{ submitting ? '\u4ea4\u5377\u4e2d...' : '\u786e\u8ba4\u4ea4\u5377' }}
          </AppActionButton>
        </aside>

        <div
          v-if="fullscreenRequired"
          class="exam-fullscreen-lock-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-fullscreen-lock-title"
        >
          <div class="exam-fullscreen-lock-card">
            <span class="exam-fullscreen-lock-icon" aria-hidden="true">⛶</span>
            <span class="exam-fullscreen-lock-eyebrow">作答区域已锁定</span>
            <h2 id="exam-fullscreen-lock-title">请进入全屏答题</h2>
            <p>
              进入全屏后，试题、选项和答题卡才可以操作。考试期间请保持全屏，切屏或退出全屏会被记录。
            </p>
            <AppActionButton variant="primary" icon="⛶" @click="requestExamFullscreen">
              进入全屏答题
            </AppActionButton>
            <small>也可以点击顶部的“进入全屏答题”按钮</small>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>
