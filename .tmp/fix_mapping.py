from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/web/GradingTaskController.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('    @GetMapping\n    public ApiResponse<List<GradingTaskResponse>> listTasks', '    @GetMapping(params = "!page")\n    public ApiResponse<List<GradingTaskResponse>> listTasks')
p.write_text(text,encoding='utf-8')
