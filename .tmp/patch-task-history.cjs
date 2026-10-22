const fs=require('fs');
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/repository/AiQuestionGenerationTaskRepository.java';
let s=fs.readFileSync(p,'utf8');
s=s.replace('import java.util.Optional;\r\nimport org.springframework.data.jpa.repository.JpaRepository;', 'import java.util.Optional;\r\nimport org.springframework.data.domain.Page;\r\nimport org.springframework.data.domain.Pageable;\r\nimport org.springframework.data.jpa.repository.JpaRepository;');
s=s.replace('    Optional<AiQuestionGenerationTaskEntity> findFirstByTeacherIdAndStatusInOrderByRequestedAtDesc(\r\n        String teacherId,\r\n        Collection<AiQuestionGenerationTaskStatus> statuses\r\n    );\r\n}', '    Optional<AiQuestionGenerationTaskEntity> findFirstByTeacherIdAndStatusInOrderByRequestedAtDesc(\r\n        String teacherId,\r\n        Collection<AiQuestionGenerationTaskStatus> statuses\r\n    );\r\n\r\n    Page<AiQuestionGenerationTaskEntity> findByTeacherIdOrderByRequestedAtDesc(String teacherId, Pageable pageable);\r\n}');
fs.writeFileSync(p,s,'utf8');

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiQuestionGenerationTaskService.java';
s=fs.readFileSync(p,'utf8');
s=s.replace('import com.mindmark.server.common.api.ErrorCode;\r\n', 'import com.mindmark.server.common.api.ErrorCode;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
s=s.replace('import org.springframework.stereotype.Service;', 'import org.springframework.data.domain.PageRequest;\r\nimport org.springframework.data.domain.Sort;\r\nimport org.springframework.stereotype.Service;');
const insertAfter=`    @Transactional(readOnly = true)\r\n    public AiQuestionGenerationTaskResponse getTask(String taskId, AuthUserEntity teacher) {\r\n        AiQuestionGenerationTaskEntity task = taskRepository.findById(taskId)\r\n            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "AI question generation task not found"));\r\n        if (!teacher.getId().equals(task.getTeacherId())) {\r\n            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot access another teacher's AI question generation task");\r\n        }\r\n        return toResponse(task);\r\n    }`;
const add=`    @Transactional(readOnly = true)\r\n    public PageResponse<AiQuestionGenerationTaskResponse> listTasks(AuthUserEntity teacher, int page, int pageSize) {\r\n        int safePage = Math.max(page, 1);\r\n        int safePageSize = Math.min(Math.max(pageSize, 1), 50);\r\n        var taskPage = taskRepository.findByTeacherIdOrderByRequestedAtDesc(\r\n            teacher.getId(),\r\n            PageRequest.of(safePage - 1, safePageSize, Sort.by(Sort.Direction.DESC, "requestedAt"))\r\n        );\r\n        return new PageResponse<>(\r\n            taskPage.getContent().stream().map(this::toResponse).toList(),\r\n            taskPage.getTotalElements(),\r\n            safePage,\r\n            safePageSize\r\n        );\r\n    }`;
if(!s.includes(insertAfter)){console.error('service marker not found'); process.exit(1)}
s=s.replace(insertAfter, insertAfter+'\r\n\r\n'+add);
fs.writeFileSync(p,s,'utf8');

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/web/AiQuestionController.java';
s=fs.readFileSync(p,'utf8');
s=s.replace('import com.mindmark.server.common.api.ErrorCode;\r\n', 'import com.mindmark.server.common.api.ErrorCode;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
const ctrlMarker=`    @PostMapping("/questions/generation-tasks")\r\n    public ApiResponse<AiQuestionGenerationTaskResponse> createAiQuestionGenerationTask(`;
const ctrlAdd=`    @GetMapping("/questions/generation-tasks")\r\n    public ApiResponse<PageResponse<AiQuestionGenerationTaskResponse>> listAiQuestionGenerationTasks(\r\n        @RequestHeader(value = "Authorization", required = false) String authorization,\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "10") int pageSize\r\n    ) {\r\n        AuthUserEntity teacher = requireAiRole(authorization);\r\n        return ApiResponse.success(generationTaskService.listTasks(teacher, page, pageSize));\r\n    }\r\n\r\n`;
if(!s.includes(ctrlMarker)){console.error('controller marker not found'); process.exit(1)}
s=s.replace(ctrlMarker, ctrlAdd+ctrlMarker);
fs.writeFileSync(p,s,'utf8');
