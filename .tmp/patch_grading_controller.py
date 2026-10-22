from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/web/GradingTaskController.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('import com.mindmark.server.common.api.ApiResponse;\n', 'import com.mindmark.server.common.api.ApiResponse;\nimport com.mindmark.server.common.api.PageResponse;\n')
text=text.replace('import com.mindmark.server.modules.grading.dto.GradingTaskResponse;\n', 'import com.mindmark.server.modules.grading.dto.GradingItemResponse;\nimport com.mindmark.server.modules.grading.dto.GradingTaskResponse;\n')
old='''    @GetMapping\n    public ApiResponse<List<GradingTaskResponse>> listTasks(@RequestParam(required = false) String examId) {\n        return ApiResponse.success(gradingTaskService.listTasks(examId));\n    }\n\n    @GetMapping("/{gradingTaskId}")\n'''
new='''    @GetMapping\n    public ApiResponse<List<GradingTaskResponse>> listTasks(@RequestParam(required = false) String examId) {\n        return ApiResponse.success(gradingTaskService.listTasks(examId));\n    }\n\n    @GetMapping(params = {"page", "pageSize"})\n    public ApiResponse<PageResponse<GradingTaskResponse>> listTasksPage(\n        @RequestParam(required = false) String examId,\n        @RequestParam Integer page,\n        @RequestParam Integer pageSize\n    ) {\n        return ApiResponse.success(gradingTaskService.listTasksPage(examId, page, pageSize));\n    }\n\n    @GetMapping("/{gradingTaskId}/items")\n    public ApiResponse<PageResponse<GradingItemResponse>> listTaskItems(\n        @PathVariable String gradingTaskId,\n        @RequestParam(defaultValue = "1") Integer page,\n        @RequestParam(defaultValue = "10") Integer pageSize\n    ) {\n        return ApiResponse.success(gradingTaskService.listTaskItems(gradingTaskId, page, pageSize));\n    }\n\n    @GetMapping("/{gradingTaskId}")\n'''
if old not in text:
    raise SystemExit('anchor not found')
text=text.replace(old,new)
p.write_text(text,encoding='utf-8')
