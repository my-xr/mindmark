from pathlib import Path
p = Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace("import PageHeader from '@/components/common/PageHeader.vue';\n", '')
old_header = '''    <PageHeader
      v-if="exam"
      :title="exam.title"
      description="在线答题仅在考试时间窗内开放，请保持全屏并按时保存或交卷。"
    >
      <template #actions>
        <AppActionButton :to="`/student/exams/${exam.id}/notice`"> 返回考试须知 </AppActionButton>
      </template>
    </PageHeader>
'''
new_header = '''    <section v-if="exam" class="exam-taking-topbar" aria-label="考试状态栏">
      <div class="exam-taking-title-block">
        <span class="exam-taking-eyebrow">{{ exam.courseName }} · {{ exam.paper.totalScore }} 分</span>
        <h1>{{ exam.title }}</h1>
        <p>{{ exam.paper.title }}</p>
      </div>

      <div class="exam-taking-control-zone">
        <div :class="['exam-timer-chip', `exam-timer-chip--${countdownTone}`]">
          <span>剩余时间</span>
          <strong>{{ countdownText }}</strong>
        </div>

        <details v-if="baseCanEdit" class="exam-guard-details">
          <summary>
            <span>{{ fullscreenRequired ? '待进入全屏' : '全屏监考中' }}</span>
            <b>{{ proctorEvents.length }}/3</b>
          </summary>
          <div class="exam-guard-panel">
            <div class="exam-guard-panel__head">
              <StatusTag
                :label="fullscreenRequired ? '需要全屏' : '状态正常'"
                :tone="fullscreenRequired ? 'warning' : 'success'"
              />
              <span>异常 {{ proctorEvents.length }}/3</span>
            </div>
            <p>
              考试期间请保持全屏。切屏、失焦或退出全屏会被记录，多次异常将触发自动交卷。
            </p>
            <AppActionButton
              class="full-width"
              variant="primary"
              :disabled="!fullscreenRequired"
              @click="requestExamFullscreen"
            >
              {{ fullscreenRequired ? '进入全屏答题' : '已进入全屏' }}
            </AppActionButton>
            <ul v-if="proctorEvents.length" class="proctor-event-list exam-guard-events">
              <li v-for="event in proctorEvents" :key="event">{{ event }}</li>
            </ul>
          </div>
        </details>

        <AppActionButton :to="`/student/exams/${exam.id}/notice`">考试须知</AppActionButton>
      </div>
    </section>
'''
if old_header not in s:
    raise SystemExit('header block not found')
s = s.replace(old_header, new_header)
old_security = '''      <section v-if="baseCanEdit" class="content-card exam-security-card">
        <div class="exam-security-main">
          <div>
            <span class="soft-tag">考试监考</span>
            <h2>剩余时间 {{ countdownText }}</h2>
            <p class="muted-text">
              考试需保持全屏。切屏、失焦或退出全屏会被记录，多次异常将自动交卷。
            </p>
          </div>
          <StatusTag
            :label="fullscreenRequired ? '待进入全屏' : '全屏答题中'"
            :tone="fullscreenRequired ? 'warning' : 'success'"
          />
        </div>
        <div class="exam-security-grid">
          <article :class="['exam-countdown-card', `exam-countdown-card--${countdownTone}`]">
            <span>倒计时</span>
            <strong>{{ countdownText }}</strong>
          </article>
          <article>
            <span>异常次数</span>
            <strong>{{ proctorEvents.length }}/3</strong>
          </article>
          <AppActionButton
            variant="primary"
            :disabled="!fullscreenRequired"
            @click="requestExamFullscreen"
          >
            {{ fullscreenRequired ? '进入全屏答题' : '已进入全屏' }}
          </AppActionButton>
        </div>
        <ul v-if="proctorEvents.length" class="proctor-event-list">
          <li v-for="event in proctorEvents" :key="event">{{ event }}</li>
        </ul>
      </section>

'''
if old_security not in s:
    raise SystemExit('security block not found')
s = s.replace(old_security, '')
old_overview = '''      <section class="content-card taking-overview-card">
        <div>
          <span class="soft-tag">{{ exam.courseName }}</span>
          <h2>{{ exam.paper.title }}</h2>
          <p class="muted-text">{{ exam.startTime }} - {{ exam.endTime }}</p>
        </div>
        <div class="taking-stat-grid">
          <article>
            <span>已答</span>
            <strong>{{ answeredCount }}/{{ paperQuestions.length }}</strong>
          </article>
          <article>
            <span>剩余</span>
            <strong>{{ remainingCount }}</strong>
          </article>
          <article>
            <span>时长</span>
            <strong>{{ exam.durationMinutes }} 分钟</strong>
          </article>
        </div>
        <div class="taking-progress-meter" aria-label="答题进度">
          <i :style="{ width: `${answeredPercent}%` }" />
        </div>
      </section>

'''
new_overview = '''      <section class="exam-taking-progress-strip" aria-label="答题概览">
        <div class="exam-taking-progress-text">
          <strong>答题进度 {{ answeredCount }}/{{ paperQuestions.length }}</strong>
          <span>未答 {{ remainingCount }} 题 · 时长 {{ exam.durationMinutes }} 分钟 · {{ exam.startTime }} - {{ exam.endTime }}</span>
        </div>
        <div class="taking-progress-meter" aria-label="答题进度">
          <i :style="{ width: `${answeredPercent}%` }" />
        </div>
      </section>

'''
if old_overview not in s:
    raise SystemExit('overview block not found')
s = s.replace(old_overview, new_overview)
p.write_text(s, encoding='utf-8')
