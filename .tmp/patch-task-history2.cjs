const fs=require('fs');
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiQuestionGenerationTaskService.java';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')) s=s.replace('import com.mindmark.server.common.api.ErrorCode;\n', 'import com.mindmark.server.common.api.ErrorCode;\nimport com.mindmark.server.common.api.PageResponse;\n');
if(!s.includes('import org.springframework.data.domain.PageRequest;')) s=s.replace('import org.springframework.stereotype.Service;\n', 'import org.springframework.data.domain.PageRequest;\nimport org.springframework.data.domain.Sort;\nimport org.springframework.stereotype.Service;\n');
const method=`\n    @Transactional(readOnly = true)\n    public PageResponse<AiQuestionGenerationTaskResponse> listTasks(AuthUserEntity teacher, int page, int pageSize) {\n        int safePage = Math.max(page, 1);\n        int safePageSize = Math.min(Math.max(pageSize, 1), 50);\n        var taskPage = taskRepository.findByTeacherIdOrderByRequestedAtDesc(\n            teacher.getId(),\n            PageRequest.of(safePage - 1, safePageSize, Sort.by(Sort.Direction.DESC, "requestedAt"))\n        );\n        return new PageResponse<>(\n            taskPage.getContent().stream().map(this::toResponse).toList(),\n            taskPage.getTotalElements(),\n            safePage,\n            safePageSize\n        );\n    }\n`;
if(!s.includes('PageResponse<AiQuestionGenerationTaskResponse> listTasks')) {
  s=s.replace(/    @Transactional\(readOnly = true\)\n    public AiQuestionGenerationTaskResponse getTask[\s\S]*?\n    }\n\n    AiQuestionGenerationTaskResponse toResponse/, m => m.replace('\n\n    AiQuestionGenerationTaskResponse toResponse', method+'\n    AiQuestionGenerationTaskResponse toResponse'));
}
fs.writeFileSync(p,s,'utf8');

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/web/AiQuestionController.java';
s=fs.readFileSync(p,'utf8');
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')) s=s.replace('import com.mindmark.server.common.api.ErrorCode;\n', 'import com.mindmark.server.common.api.ErrorCode;\nimport com.mindmark.server.common.api.PageResponse;\n');
const ctrl=`\n    @GetMapping("/questions/generation-tasks")\n    public ApiResponse<PageResponse<AiQuestionGenerationTaskResponse>> listAiQuestionGenerationTasks(\n        @RequestHeader(value = "Authorization", required = false) String authorization,\n        @RequestParam(defaultValue = "1") int page,\n        @RequestParam(defaultValue = "10") int pageSize\n    ) {\n        AuthUserEntity teacher = requireAiRole(authorization);\n        return ApiResponse.success(generationTaskService.listTasks(teacher, page, pageSize));\n    }\n`;
if(!s.includes('listAiQuestionGenerationTasks')) {
  s=s.replace('\n    @PostMapping("/questions/generation-tasks")', ctrl+'\n    @PostMapping("/questions/generation-tasks")');
}
fs.writeFileSync(p,s,'utf8');
