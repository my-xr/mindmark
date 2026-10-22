const fs = require('fs');
const path = 'apps/mindmark-web/src/views/teacher/StudentRosterView.vue';
let s = fs.readFileSync(path, 'utf8');
const start = s.indexOf('    <PageSection\n      class="roster-import-card roster-import-card--refined"');
const endMarker = '    </PageSection>';
const end = s.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('target block not found');
const neu = `    <PageSection
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
            <select v-model="classId" class="select-input" @change="loadStudents">
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
    </PageSection>`;
s = s.slice(0, start) + neu + s.slice(end + endMarker.length);
fs.writeFileSync(path, s, 'utf8');
