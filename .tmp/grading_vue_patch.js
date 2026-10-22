const fs=require('fs'); const p='apps/mindmark-web/src/views/teacher/GradingView.vue'; let t=fs.readFileSync(p,'utf8');
if (!t.includes('一键复核不及格')) {
  const needle = `            <AppActionButton
              class="icon-action-button"
              icon="✅"
              size="sm"
              title="一键核对通过"
              :loading="batchOperating"
              :disabled="batchOperating || tasksTotal === 0"
              @click="handleBatchConfirm(false)"
            >
              一键核对
            </AppActionButton>`;
  const insert = `${needle}
            <AppActionButton
              class="icon-action-button"
              icon="⚠️"
              size="sm"
              variant="danger"
              title="一键复核不及格"
              :loading="batchOperating"
              :disabled="batchOperating || tasksTotal === 0 || failedCount === 0"
              @click="handleBatchConfirm(true)"
            >
              复核不及格
            </AppActionButton>`;
  t=t.replace(needle, insert);
}
fs.writeFileSync(p,t,'utf8');
