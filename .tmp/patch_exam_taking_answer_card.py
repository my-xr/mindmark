from pathlib import Path
p=Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
text=p.read_text(encoding='utf-8')
if "import type { QuestionType } from '@/types/question';" not in text:
    text=text.replace("import type { PaperQuestion } from '@/types/paper';\n", "import type { PaperQuestion } from '@/types/paper';\nimport type { QuestionType } from '@/types/question';\n")
anchor = "const answeredPercent = computed(() => {\n  if (!paperQuestions.value.length) {\n    return 0;\n  }\n  return Math.round((answeredCount.value / paperQuestions.value.length) * 100);\n});\n"
insert = r'''

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
'''
if 'const questionTypeOrder' not in text:
    text=text.replace(anchor, anchor+insert)
new = '''        <aside class="question-card answer-card-panel">
          <div class="answer-card-header">
            <div>
              <strong>&#31572;&#39064;&#21345;</strong>
              <p class="muted-text">&#25353;&#39064;&#22411;&#20998;&#32452;&#65292;&#28857;&#20987;&#39064;&#21495;&#24555;&#36895;&#20999;&#25442;&#12290;</p>
            </div>
            <span class="soft-tag">{{ answeredPercent }}%</span>
          </div>

          <div class="answer-card-type-groups" aria-label="&#25353;&#39064;&#22411;&#20998;&#32452;&#30340;&#31572;&#39064;&#21345;">
            <section
              v-for="group in answerCardGroups"
              :key="group.type"
              :class="['answer-card-type-group', `answer-card-type-group--${group.type.toLowerCase()}`]"
            >
              <div class="answer-card-type-title">
                <span>
                  <i>{{ group.shortLabel }}</i>
                  {{ group.label }}
                </span>
                <em>{{ group.answeredCount }}/{{ group.items.length }} &#39064; ? {{ group.score }} &#20998;</em>
              </div>
              <div class="question-number-grid question-number-grid--typed">
                <button
                  v-for="{ item, index } in group.items"
                  :key="item.id"
                  :class="[
                    'question-number-button',
                    questionNumberTypeClass(item.question.type),
                    { active: index === currentIndex, answered: hasAnswer(item.questionId) },
                  ]"
                  type="button"
                  :title="`${group.label} ? ${index + 1} ?`"
                  @click="jumpTo(index)"
                >
                  {{ index + 1 }}
                </button>
              </div>
            </section>
          </div>

          <div class="taking-progress answer-card-summary">
            <span>&#24050;&#31572; {{ answeredCount }}/{{ paperQuestions.length }}</span>
            <span>&#24635;&#20998; {{ exam.paper.totalScore }}</span>
          </div>
          <AppActionButton
            class="full-width"
            variant="primary"
            :disabled="submitting || !canEdit"
            @click="submit"
          >
            {{ submitting ? '\u4ea4\u5377\u4e2d...' : '\u786e\u8ba4\u4ea4\u5377' }}
          </AppActionButton>
        </aside>'''
start=text.index('        <aside class="question-card answer-card-panel">')
end=text.index('        </aside>', start)+len('        </aside>')
text=text[:start]+new+text[end:]
p.write_text(text,encoding='utf-8')
