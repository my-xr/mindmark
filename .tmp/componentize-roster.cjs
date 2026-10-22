const fs = require('fs');
const path = 'apps/mindmark-web/src/views/teacher/StudentRosterView.vue';
let s = fs.readFileSync(path, 'utf8');
if (!s.includes("import PageSection from '@/components/common/PageSection.vue';")) {
  s = s.replace("import ErrorState from '@/components/common/ErrorState.vue';\n", "import ErrorState from '@/components/common/ErrorState.vue';\nimport PageSection from '@/components/common/PageSection.vue';\n");
}
if (!s.includes("import SummaryStrip from '@/components/common/SummaryStrip.vue';")) {
  s = s.replace("import StatusTag from '@/components/common/StatusTag.vue';\n", "import StatusTag from '@/components/common/StatusTag.vue';\nimport SummaryStrip from '@/components/common/SummaryStrip.vue';\n");
}
const importHeaderOld = `<section class="content-card roster-import-card roster-import-card--refined">
      <div class="section-title roster-section-title">
        <div>
          <h2>名单导入</h2>
          <p class="muted-text">先选择教学班，再粘贴 CSV 内容；重复学号会自动跳过。</p>
        </div>
        <span class="soft-tag">初始密码：学号后 6 位</span>
      </div>`;
const importHeaderNew = `<PageSection
      class="roster-import-card roster-import-card--refined"
      title="名单导入"
      description="先选择教学班，再粘贴 CSV 内容；重复学号会自动跳过。"
      header-class="roster-section-title"
    >
      <template #actions>
        <span class="soft-tag">初始密码：学号后 6 位</span>
      </template>`;
if (!s.includes(importHeaderNew)) {
  if (!s.includes(importHeaderOld)) throw new Error('import header not found');
  s = s.replace(importHeaderOld, importHeaderNew);
}
const summaryOld = `<div v-if="selectedClass" class="roster-class-summary">
            <span class="eyebrow-text">当前班级</span>
            <strong>{{ selectedClass.name }}</strong>
            <p>{{ selectedClass.grade || '-' }} · {{ selectedClass.major || '-' }}</p>
            <small>ID：{{ classId }}</small>
          </div>`;
const summaryNew = `<SummaryStrip
            v-if="selectedClass"
            class="roster-class-summary"
            eyebrow="当前班级"
            :title="selectedClass.name"
            :description="(selectedClass.grade || '-') + ' · ' + (selectedClass.major || '-')"
          >
            <small>ID：{{ classId }}</small>
          </SummaryStrip>`;
if (!s.includes(summaryNew)) {
  if (!s.includes(summaryOld)) throw new Error('class summary not found');
  s = s.replace(summaryOld, summaryNew);
}
const importCloseOld = `      <div class="roster-actions roster-actions--refined">
        <span class="roster-count-pill">有效数据 {{ parsedRows.length }} 行</span>
        <button
          class="primary-button"
          :disabled="importing || !selectedClass"
          type="button"
          @click="handleImport"
        >
          {{ importing ? '导入中...' : '导入并创建账号' }}
        </button>
      </div>
    </section>`;
const importCloseNew = `      <div class="roster-actions roster-actions--refined">
        <span class="roster-count-pill">有效数据 {{ parsedRows.length }} 行</span>
        <button
          class="primary-button"
          :disabled="importing || !selectedClass"
          type="button"
          @click="handleImport"
        >
          {{ importing ? '导入中...' : '导入并创建账号' }}
        </button>
      </div>
    </PageSection>`;
if (!s.includes(importCloseNew)) {
  if (!s.includes(importCloseOld)) throw new Error('import close not found');
  s = s.replace(importCloseOld, importCloseNew);
}
const listHeaderOld = `<section class="content-card roster-list-card">
      <div class="section-title roster-section-title">
        <div>
          <h2>已导入学生</h2>
          <p class="muted-text">按当前教学班查看账号状态，教师/助教可重置学生密码。</p>
        </div>
        <div class="roster-list-actions">
          <span class="soft-tag">共 {{ students.length }} 人</span>
          <span class="soft-tag">待首次改密 {{ mustChangePasswordCount }} 人</span>
          <button
            class="secondary-button"
            :disabled="loading || !selectedClass"
            type="button"
            @click="loadStudents"
          >
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>
      </div>`;
const listHeaderNew = `<PageSection
      class="roster-list-card"
      title="已导入学生"
      description="按当前教学班查看账号状态，教师/助教可重置学生密码。"
      header-class="roster-section-title"
    >
      <template #actions>
        <div class="roster-list-actions">
          <span class="soft-tag">共 {{ students.length }} 人</span>
          <span class="soft-tag">待首次改密 {{ mustChangePasswordCount }} 人</span>
          <button
            class="secondary-button"
            :disabled="loading || !selectedClass"
            type="button"
            @click="loadStudents"
          >
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>
      </template>`;
if (!s.includes(listHeaderNew)) {
  if (!s.includes(listHeaderOld)) throw new Error('list header not found');
  s = s.replace(listHeaderOld, listHeaderNew);
}
const finalClose = `        <div v-if="students.length === 0" class="student-account-empty">
          当前班级暂无学生，请先下载模板并导入名单。
        </div>
      </div>
    </section>`;
const finalCloseNew = `        <div v-if="students.length === 0" class="student-account-empty">
          当前班级暂无学生，请先下载模板并导入名单。
        </div>
      </div>
    </PageSection>`;
if (!s.includes(finalCloseNew)) {
  if (!s.includes(finalClose)) throw new Error('list close not found');
  s = s.replace(finalClose, finalCloseNew);
}
fs.writeFileSync(path, s, 'utf8');
