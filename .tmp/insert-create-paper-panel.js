const fs=require('fs');
const p='apps/mindmark-web/src/views/teacher/PapersView.vue';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('create-paper-inline-panel')){
const panel=`
        <div v-if="createPaperPanelOpen" class="create-paper-inline-panel">
          <div class="inline-form-title">
            <strong>创建新试卷</strong>
            <span>先确定课程与考试时长，再使用 100 分组卷模板补题。</span>
          </div>
          <div class="create-paper-form-grid">
            <label>
              <span>试卷名称</span>
              <input
                v-model.trim="createPaperForm.title"
                class="text-input"
                placeholder="例如：前端工程实践期末 A 卷"
              />
            </label>
            <label>
              <span>课程</span>
              <select v-model="createPaperForm.courseId" class="text-input">
                <option value="" disabled>请选择课程</option>
                <option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.name }}（{{ course.code }}）
                </option>
              </select>
            </label>
            <label>
              <span>考试时长</span>
              <input
                v-model.number="createPaperForm.durationMinutes"
                class="text-input"
                type="number"
                min="1"
                step="1"
              />
            </label>
            <label class="create-paper-description">
              <span>说明</span>
              <input
                v-model.trim="createPaperForm.description"
                class="text-input"
                placeholder="可选：适用班级、考试范围或命题说明"
              />
            </label>
          </div>
          <div class="create-paper-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✖️"
              size="sm"
              :disabled="operating"
              title="取消创建"
              @click="cancelCreatePaper"
            >
              取消
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              size="sm"
              variant="primary"
              :loading="operating"
              :disabled="operating"
              title="保存试卷"
              @click="submitCreatePaper"
            >
              保存试卷
            </AppActionButton>
          </div>
        </div>
`;
s=s.replace('        </div>\n        <button\n          v-for="paper in papers"', '        </div>'+panel+'        <button\n          v-for="paper in papers"');
}
fs.writeFileSync(p,s,'utf8');
