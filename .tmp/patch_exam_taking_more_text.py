from pathlib import Path
p=Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
lines=p.read_text(encoding='utf-8').splitlines()
for i,line in enumerate(lines):
    if "fullscreenRequired ?" in line and "@click" not in line:
        if "<span>" in line:
            lines[i]="            <span>&#32771;&#35797;&#30417;&#32771; ? {{ fullscreenRequired ? '\\u672a\\u5168\\u5c4f' : '\\u6b63\\u5e38' }}</span>"
        elif ":label=" in line:
            lines[i]="                :label=\"fullscreenRequired ? '\\u9700\\u8981\\u5168\\u5c4f' : '\\u72b6\\u6001\\u6b63\\u5e38'\""
        elif "{{ fullscreenRequired" in line:
            lines[i]="          {{ fullscreenRequired ? '\\u8fdb\\u5165\\u5168\\u5c4f\\u7b54\\u9898' : '\\u5df2\\u8fdb\\u5165\\u5168\\u5c4f' }}" if i < 520 else "              {{ fullscreenRequired ? '\\u8fdb\\u5165\\u5168\\u5c4f\\u7b54\\u9898' : '\\u5df2\\u8fdb\\u5165\\u5168\\u5c4f' }}"
    if "{{ exam.title }}" in line and "sheet.submittedAt" in line:
        lines[i]="        {{ exam.title }} &#24050;&#20110; {{ sheet.submittedAt ?? '\\u5f53\\u524d\\u65f6\\u95f4' }} &#25552;&#20132;&#65292;&#31995;&#32479;&#24050;&#36827;&#20837;&#25209;&#25913;&#27969;&#31243;&#12290;"
    if "{{ saving ?" in line:
        lines[i]="              {{ saving ? '\\u4fdd\\u5b58\\u4e2d...' : '\\u4fdd\\u5b58\\u8349\\u7a3f' }}"
    if "{{ submitting ?" in line:
        lines[i]="            {{ submitting ? '\\u4ea4\\u5377\\u4e2d...' : '\\u786e\\u8ba4\\u4ea4\\u5377' }}"
    if "group.answeredCount" in line and "group.score" in line:
        lines[i]="                <em>{{ group.answeredCount }}/{{ group.items.length }} &#39064; &#183; {{ group.score }} &#20998;</em>"
    if ':title="`${group.label}' in line:
        lines[i]="                  :title=\"`${group.label} \\u7b2c ${index + 1} \\u9898`\""
# Fix load error fallback based on location in loadExam catch: after line with loadErrorMessage.value
for i,line in enumerate(lines):
    if line.strip().startswith('loadErrorMessage.value ='):
        lines[i]="    loadErrorMessage.value = error instanceof Error ? error.message : '\\u8003\\u8bd5\\u52a0\\u8f7d\\u5931\\u8d25\\uff0c\\u8bf7\\u91cd\\u8bd5';"
p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
