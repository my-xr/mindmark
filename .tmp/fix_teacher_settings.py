from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('''        <!-- <button
          class="secondary-button"
          type="button"
          :disabled="isSaving || isLoading || isTesting"
          @click="resetToDefault"
        >
          恢复默认地址与模型
        </button> -->''','''        <button
          class="secondary-button"
          type="button"
          :disabled="isSaving || isLoading || isTesting"
          @click="resetToDefault"
        >
          恢复默认地址与模型
        </button>''')
p.write_text(text,encoding='utf-8')
