from pathlib import Path
p=Path('apps/mindmark-web/src/views/student/ExamTakingView.vue')
lines=p.read_text(encoding='utf-8').splitlines()
for idx,line in enumerate(lines):
    s=line.strip()
    if "void autoSubmit(" in line:
        lines[idx]="    void autoSubmit('\\u68c0\\u6d4b\\u5230\\u591a\\u6b21\\u5207\\u5c4f\\u6216\\u9000\\u51fa\\u5168\\u5c4f\\uff0c\\u7cfb\\u7edf\\u5df2\\u81ea\\u52a8\\u4ea4\\u5377');"
    elif "recordProctorEvent('VISIBILITY_HIDDEN'" in line:
        lines[idx]="    recordProctorEvent('VISIBILITY_HIDDEN', '\\u9875\\u9762\\u4e0d\\u53ef\\u89c1/\\u7591\\u4f3c\\u5207\\u5c4f');"
    elif "recordProctorEvent('WINDOW_BLUR'" in line:
        lines[idx]="  recordProctorEvent('WINDOW_BLUR', '\\u7a97\\u53e3\\u5931\\u7126/\\u7591\\u4f3c\\u5207\\u5c4f');"
    elif "recordProctorEvent('FULLSCREEN_EXIT'" in line:
        lines[idx]="    recordProctorEvent('FULLSCREEN_EXIT', '\\u9000\\u51fa\\u5168\\u5c4f\\u8003\\u8bd5\\u73af\\u5883');"
    elif "operationMessage.value = '" in line and 'saveDraft' not in line and '?' in line:
        lines[idx]="    operationMessage.value = '\\u8349\\u7a3f\\u5df2\\u4fdd\\u5b58\\uff0c\\u7cfb\\u7edf\\u5df2\\u8bb0\\u5f55\\u672c\\u6b21\\u7b54\\u9898\\u8fdb\\u5ea6\\u3002';"
    elif "error instanceof Error ? error.message" in line and idx>0 and '?' in line:
        # distinguish load error by nearby context after loop if needed
        lines[idx]="      error instanceof Error ? error.message : '\\u4ea4\\u5377\\u5931\\u8d25\\uff0c\\u8bf7\\u786e\\u8ba4\\u8003\\u8bd5\\u4ecd\\u5904\\u4e8e\\u7b54\\u9898\\u65f6\\u95f4\\u5185';"
    elif "requestUserConfirmation" in line and '?' in line:
        lines[idx]="  const confirmed = await requestUserConfirmation('\\u786e\\u8ba4\\u4ea4\\u5377\\uff1f\\u63d0\\u4ea4\\u540e\\u5c06\\u4e0d\\u80fd\\u7ee7\\u7eed\\u4fee\\u6539\\u7b54\\u6848\\u3002');"
    elif "loadErrorMessage.value" in line and '?' in line:
        lines[idx]="    loadErrorMessage.value = error instanceof Error ? error.message : '\\u8003\\u8bd5\\u52a0\\u8f7d\\u5931\\u8d25\\uff0c\\u8bf7\\u91cd\\u8bd5';"
# restore draft save error specifically around saveDraft block: first fallback after line containing saveDraft error is same as submit now; acceptable maybe save/submit both ok but change first occurrence after operation message
text='\n'.join(lines)+'\n'
text=text.replace("error instanceof Error ? error.message : '\\u4ea4\\u5377\\u5931\\u8d25\\uff0c\\u8bf7\\u786e\\u8ba4\\u8003\\u8bd5\\u4ecd\\u5904\\u4e8e\\u7b54\\u9898\\u65f6\\u95f4\\u5185';\n  } finally {\n    saving.value = false;", "error instanceof Error ? error.message : '\\u4fdd\\u5b58\\u5931\\u8d25\\uff0c\\u8bf7\\u786e\\u8ba4\\u8003\\u8bd5\\u4ecd\\u5904\\u4e8e\\u7b54\\u9898\\u65f6\\u95f4\\u5185';\n  } finally {\n    saving.value = false;")
p.write_text(text,encoding='utf-8')
