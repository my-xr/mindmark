const fs = require('fs');

function replaceTemplate(file, template) {
  const s = fs.readFileSync(file, 'utf8');
  const marker = '</script>';
  const idx = s.indexOf(marker);
  if (idx < 0) throw new Error(`Missing script marker in ${file}`);
  const next = s.slice(0, idx + marker.length) + '\n\n' + template.trimStart() + '\n';
  fs.writeFileSync(file, next, 'utf8');
}

// Reviews page: add page-specific classes and a focused current-review summary module.
replaceTemplate('apps/mindmark-web/src/views/teacher/ReviewsView.vue', `
<template>
  <div class="page-shell review-page">
    <PageHeader
      title="考试复盘与 AI 讲评"
      description="从教师视角查看考试成绩分布、薄弱点、AI 讲评稿与导出产物。"
    >
      <template #actions>
        <button class="secondary-button" type="button" :disabled="loading" @click="loadData">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </template>
    </PageHeader>

    <OperationNotice
      v-if="operationMessage"
      title="操作成功"
      :description="operationMessage"
      tone="success"
    />
    <OperationNotice
      v-if="errorMessage"
      title="操作失败"
      :description="errorMessage"
      tone="danger"
    />

    <main class="two-column-layout review-page-layout">
      <ReviewReportSelector
        :reports="reports"
        :selected-exam-id="selectedExamId"
        :loading="loading"
        @select="selectReport"
      />

      <section v-if="selectedReport" class="detail-panel review-detail-panel">
        <section class="content-card review-current-card">
          <div class="review-current-main">
            <span class="eyebrow-text">当前复盘</span>
            <h2>{{ selectedReport.examTitle }}</h2>
            <p>{{ selectedReport.courseName }} · {{ selectedReport.reviewedCount }}/{{ selectedReport.submittedCount }} 已批改</p>
          </div>
          <div class="review-current-stats">
            <span>平均分 <strong>{{ selectedReport.averageScore }}</strong></span>
            <span>及格率 <strong>{{ selectedReport.passRate }}%</strong></span>
            <span>薄弱点 <strong>{{ weakKnowledgeCount }}</strong></span>
          </div>
        </section>

        <ReviewAnalysisSections
          :report="selectedReport"
          :weak-knowledge-count="weakKnowledgeCount"
          :exporting-type="exportingType"
          @export-artifact="exportArtifact"
        />

        <LectureDraftCard
          v-model:lecture-content="lectureContent"
          :report="selectedReport"
          :generation-task="generationTask"
          :generating="generating"
          :exporting-type="exportingType"
          :approving="approving"
          @regenerate="regenerateDraft"
          @export-artifact="exportArtifact"
          @approve="approveDraft"
        />

        <ReviewArtifactList
          :artifacts="selectedReport.artifacts ?? []"
          :downloading-artifact-id="downloadingArtifactId"
          @download="downloadArtifact"
        />
      </section>
    </main>
  </div>
</template>
`);

// Add page-specific class names to review child modules without changing behavior.
{
  const file = 'apps/mindmark-web/src/components/review/ReviewReportSelector.vue';
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace('<aside class="list-panel">', '<aside class="list-panel review-report-selector">');
  s = s.replace('<div class="content-card">', '<div class="content-card review-selector-card">');
  fs.writeFileSync(file, s, 'utf8');
}
{
  const file = 'apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue';
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace('<section class="content-card metric-grid">', '<section class="content-card metric-grid review-summary-metrics">');
  s = s.replace('<section class="content-card">\n    <div class="section-title">\n      <div>\n        <h2>成绩分布与薄弱点</h2>', '<section class="content-card review-analysis-card">\n    <div class="section-title">\n      <div>\n        <h2>成绩分布与薄弱点</h2>');
  s = s.replace('<section class="content-card">\n    <div class="section-title">\n      <div>\n        <h2>题目表现</h2>', '<section class="content-card review-question-card">\n    <div class="section-title">\n      <div>\n        <h2>题目表现</h2>');
  fs.writeFileSync(file, s, 'utf8');
}
{
  const file = 'apps/mindmark-web/src/components/review/ReviewArtifactList.vue';
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace('<section v-if="artifacts.length" class="content-card">', '<section v-if="artifacts.length" class="content-card review-artifact-card">');
  s = s.replace('<div class="question-performance-list">', '<div class="question-performance-list review-artifact-list">');
  fs.writeFileSync(file, s, 'utf8');
}

// Student roster: add counts and remodel import/list modules.
{
  const file = 'apps/mindmark-web/src/views/teacher/StudentRosterView.vue';
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('mustChangePasswordCount')) {
    s = s.replace(
      "const parsedRows = computed(() => parseCsvRows(csvText.value));\n",
      "const parsedRows = computed(() => parseCsvRows(csvText.value));\nconst mustChangePasswordCount = computed(\n  () => students.value.filter((student) => student.mustChangePassword).length,\n);\n",
    );
  }
  const script = s.slice(0, s.indexOf('</script>') + '</script>'.length);
  const template = `
<template>
  <div class="page-shell roster-page">
    <PageHeader
      title="学生名单与账号"
      description="选择真实教学班后导入学生名单并自动创建学生账号；初始密码为学号后 6 位，首次登录必须修改密码。已导入学生再次导入会自动跳过。"
    >
      <template #actions>
        <button class="secondary-button" type="button" @click="handleDownloadTemplate">
          下载导入模板
        </button>
      </template>
    </PageHeader>

    <section class="content-card roster-import-card roster-import-card--refined">
      <div class="section-title roster-section-title">
        <div>
          <h2>名单导入</h2>
          <p class="muted-text">先选择教学班，再粘贴 CSV 内容；重复学号会自动跳过。</p>
        </div>
        <span class="soft-tag">初始密码：学号后 6 位</span>
      </div>

      <div class="roster-import-layout">
        <div class="roster-class-panel">
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

          <div v-if="selectedClass" class="roster-class-summary">
            <span class="eyebrow-text">当前班级</span>
            <strong>{{ selectedClass.name }}</strong>
            <p>{{ selectedClass.grade || '-' }} · {{ selectedClass.major || '-' }}</p>
            <small>ID：{{ classId }}</small>
          </div>
          <div v-else class="roster-class-summary roster-class-summary--empty">
            <span class="eyebrow-text">当前班级</span>
            <strong>暂无可见教学班</strong>
            <p>请先由管理员创建班级并完成教师/助教授权。</p>
          </div>
        </div>

        <div class="roster-csv-panel">
          <label class="form-field form-field--full">
            粘贴 CSV 学生名单
            <textarea v-model="csvText" class="text-input roster-textarea" />
          </label>
          <p class="muted-text roster-import-tip">
            服务端会使用可信班级名称；导入内容中的 className 仅作兼容字段。
          </p>
        </div>
      </div>

      <div class="roster-actions roster-actions--refined">
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
    </section>

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

    <section class="content-card roster-list-card">
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
      </div>

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
            <button class="secondary-button" type="button" @click="handleResetPassword(student)">
              重置密码
            </button>
          </span>
        </div>
        <div v-if="students.length === 0" class="student-account-empty">
          当前班级暂无学生，请先下载模板并导入名单。
        </div>
      </div>
    </section>
  </div>
</template>
`;
  fs.writeFileSync(file, script + '\n\n' + template.trimStart() + '\n', 'utf8');
}

