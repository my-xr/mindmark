from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue')
s = p.read_text(encoding='utf-8')
if "import { getErrorMessage } from '@/utils/errorMessage';" not in s:
    s = s.replace("import { listVisibleCourses } from '@/services/academicService';\n", "import { listVisibleCourses } from '@/services/academicService';\nimport { getErrorMessage } from '@/utils/errorMessage';\n")
old = '''const review = async (draft: AiQuestionDraft, status: AiReviewStatus) => {
  reviewingId.value = draft.id;
  try {
    await reviewAiQuestion(draft.id, status);
    await loadDrafts();
  } finally {
    reviewingId.value = null;
  }
};
'''
new = '''const review = async (draft: AiQuestionDraft, status: AiReviewStatus) => {
  reviewingId.value = draft.id;
  generateMessage.value = null;
  try {
    await reviewAiQuestion(draft.id, status);
    await loadDrafts();
    await loadTaskHistory();
    generateMessageTone.value = 'success';
    generateMessage.value = status === 'REJECTED' ? '题目已驳回，可在题库管理中二次编辑后重新提交审核。' : '题目审核已通过并进入可用题库。';
  } catch (error) {
    generateMessageTone.value = 'danger';
    generateMessage.value = getErrorMessage(error, 'AI 题目审核失败，请刷新后重试。');
  } finally {
    reviewingId.value = null;
  }
};
'''
if old not in s:
    raise SystemExit('review block not found')
s = s.replace(old,new)
old_tpl = '''          <button
            class="secondary-button"
            type="button"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            @click="review(draft, 'EDITED_ACCEPTED')"
          >
            编辑后通过
          </button>
'''
new_tpl = '''          <RouterLink
            class="secondary-button"
            :to="{
              path: '/teacher/questions',
              query: {
                edit: draft.id,
                keyword: draft.id,
                source: 'AI',
                status: draft.reviewStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
              },
            }"
          >
            编辑题目
          </RouterLink>
'''
if old_tpl not in s:
    raise SystemExit('edit-after button not found')
s = s.replace(old_tpl,new_tpl)
p.write_text(s, encoding='utf-8')
