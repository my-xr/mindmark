from pathlib import Path
files = {
'apps/mindmark-web/src/components/review/LectureDraftCard.vue': [
("import PageSection from '@/components/common/PageSection.vue';", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport PageSection from '@/components/common/PageSection.vue';"),
('''        <button
          class="secondary-button"
          type="button"
          :disabled="generating"
          @click="emit('regenerate')"
        >
          {{ generating ? '生成中...' : '重新生成讲评稿' }}
        </button>''', '''        <AppActionButton icon="↻" :disabled="generating" @click="emit('regenerate')">
          {{ generating ? '生成中...' : '重新生成讲评稿' }}
        </AppActionButton>'''),
('''        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '导出中...' : '导出讲评稿' }}
        </button>''', '''        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '导出中...' : '导出讲评稿' }}
        </AppActionButton>'''),
('''        <button class="primary-button" type="button" :disabled="approving" @click="emit('approve')">
          {{ approving ? '确认中...' : '确认讲评稿' }}
        </button>''', '''        <AppActionButton
          icon="✓"
          variant="primary"
          :disabled="approving"
          @click="emit('approve')"
        >
          {{ approving ? '确认中...' : '确认讲评稿' }}
        </AppActionButton>'''),
],
'apps/mindmark-web/src/components/review/ReviewAnalysisSections.vue': [
("import PageSection from '@/components/common/PageSection.vue';", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport PageSection from '@/components/common/PageSection.vue';"),
('''        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'REVIEW_REPORT_MARKDOWN')"
        >
          {{ exportingType === 'REVIEW_REPORT_MARKDOWN' ? '导出中...' : '导出复盘报告' }}
        </button>''', '''        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'REVIEW_REPORT_MARKDOWN')"
        >
          {{ exportingType === 'REVIEW_REPORT_MARKDOWN' ? '导出中...' : '导出复盘报告' }}
        </AppActionButton>'''),
('''        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'SCORE_SUMMARY_CSV')"
        >
          {{ exportingType === 'SCORE_SUMMARY_CSV' ? '导出中...' : '导出成绩 CSV' }}
        </button>''', '''        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'SCORE_SUMMARY_CSV')"
        >
          {{ exportingType === 'SCORE_SUMMARY_CSV' ? '导出中...' : '导出成绩 CSV' }}
        </AppActionButton>'''),
],
'apps/mindmark-web/src/components/review/ReviewArtifactList.vue': [
("import PageSection from '@/components/common/PageSection.vue';", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport PageSection from '@/components/common/PageSection.vue';"),
('''          <button
            class="secondary-button"
            type="button"
            :disabled="downloadingArtifactId === artifact.id"
            @click="emit('download', artifact.id)"
          >
            {{ downloadingArtifactId === artifact.id ? '下载中...' : '下载' }}
          </button>''', '''          <AppActionButton
            icon="⇩"
            :disabled="downloadingArtifactId === artifact.id"
            @click="emit('download', artifact.id)"
          >
            {{ downloadingArtifactId === artifact.id ? '下载中...' : '下载' }}
          </AppActionButton>'''),
],
}
for file, pairs in files.items():
    p = Path(file)
    s = p.read_text(encoding='utf-8-sig')
    original = s
    for old, new in pairs:
        if old not in s:
            print('MISSING', file, old[:80].replace('\n',' '))
        else:
            s = s.replace(old, new, 1)
    if s != original:
        p.write_text(s, encoding='utf-8')
