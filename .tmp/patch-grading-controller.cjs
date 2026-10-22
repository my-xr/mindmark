const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/web/GradingTaskController.java';
let s=fs.readFileSync(f,'utf8');
if(!s.includes('GradingAiJobResponse')){
  s=s.replace('import com.mindmark.server.modules.grading.dto.BatchGradingTaskOperationResponse;\n', 'import com.mindmark.server.modules.grading.dto.BatchGradingTaskOperationResponse;\nimport com.mindmark.server.modules.grading.dto.GradingAiJobResponse;\n');
  s=s.replace('import com.mindmark.server.modules.grading.service.GradingTaskService;\n', 'import com.mindmark.server.modules.grading.service.GradingAiJobService;\nimport com.mindmark.server.modules.grading.service.GradingTaskService;\n');
}
if(!s.includes('private final GradingAiJobService gradingAiJobService;')){
  s=s.replace('    private final GradingTaskService gradingTaskService;\n\n    public GradingTaskController(GradingTaskService gradingTaskService) {\n        this.gradingTaskService = gradingTaskService;\n    }', '    private final GradingTaskService gradingTaskService;\n    private final GradingAiJobService gradingAiJobService;\n\n    public GradingTaskController(GradingTaskService gradingTaskService, GradingAiJobService gradingAiJobService) {\n        this.gradingTaskService = gradingTaskService;\n        this.gradingAiJobService = gradingAiJobService;\n    }');
}
if(!s.includes('/ai-grading-job')){
  s=s.replace('    @PostMapping("/{gradingTaskId}/auto-grade")\n    public ApiResponse<GradingTaskResponse> autoGrade(@PathVariable String gradingTaskId) {\n        return ApiResponse.success(gradingTaskService.autoGrade(gradingTaskId));\n    }', '    @PostMapping("/{gradingTaskId}/auto-grade")\n    public ApiResponse<GradingTaskResponse> autoGrade(@PathVariable String gradingTaskId) {\n        return ApiResponse.success(gradingTaskService.autoGrade(gradingTaskId));\n    }\n\n    @PostMapping("/{gradingTaskId}/ai-grading-job")\n    public ApiResponse<GradingAiJobResponse> enqueueAiGradingJob(@PathVariable String gradingTaskId) {\n        return ApiResponse.success(gradingAiJobService.enqueueIfNeeded(gradingTaskId));\n    }\n\n    @GetMapping("/{gradingTaskId}/ai-grading-job/latest")\n    public ApiResponse<GradingAiJobResponse> latestAiGradingJob(@PathVariable String gradingTaskId) {\n        return ApiResponse.success(gradingAiJobService.latestJob(gradingTaskId));\n    }');
}
fs.writeFileSync(f,s,'utf8');