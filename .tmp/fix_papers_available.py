from pathlib import Path
p = Path('D:/vc/MindMark/apps/mindmark-web/src/views/teacher/PapersView.vue')
s = p.read_text(encoding='utf-8-sig')
old = '''        <template v-else>
          <article
            v-for="question in pagedAvailableQuestions"
            :key="question.id"
            class="question-pool-item"
          >
          <div>
            <h3>{{ question.title }}</h3>
            <div class="tag-list">
              <QuestionTypeTag :type="question.type" short />
              <DifficultyTag :difficulty="question.difficulty" />
              <span class="muted-text"
                >{{ question.score }} 分 · {{ question.knowledgePoints.join(' / ') }}</span
              >
            </div>
          </div>
          <AppActionButton
            class="icon-action-button"
            icon="＋"
            :disabled="operating"
            title="加入试卷"
            @click="addQuestion(question)"
          >
            加入试卷
          </AppActionButton>
        </article>
      </section>
'''
new = '''        <template v-else>
          <article
            v-for="question in pagedAvailableQuestions"
            :key="question.id"
            class="question-pool-item"
          >
            <div>
              <h3>{{ question.title }}</h3>
              <div class="tag-list">
                <QuestionTypeTag :type="question.type" short />
                <DifficultyTag :difficulty="question.difficulty" />
                <span class="muted-text"
                  >{{ question.score }} 分 · {{ question.knowledgePoints.join(' / ') }}</span
                >
              </div>
            </div>
            <AppActionButton
              class="icon-action-button"
              icon="＋"
              :disabled="operating"
              title="加入试卷"
              @click="addQuestion(question)"
            >
              加入试卷
            </AppActionButton>
          </article>
          <EnterprisePagination
            v-if="availableQuestions.length > availableQuestionPagination.pageSize"
            class="section-pagination"
            :current="availableQuestionPagination.page"
            :page-size="availableQuestionPagination.pageSize"
            :total="availableQuestions.length"
            :page-size-options="['5', '10', '20', '50']"
            :disabled="operating"
            @change="handleAvailableQuestionPaginationChange"
          />
        </template>
      </section>
'''
if old not in s:
    raise SystemExit('old block not found')
s = s.replace(old, new)
p.write_text(s, encoding='utf-8', newline='\n')
