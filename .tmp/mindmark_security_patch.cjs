const fs=require('fs');
function read(p){ return fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''); }
function write(p,s){ fs.writeFileSync(p,s,'utf8'); }
let p,s;

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/audit/repository/ExamSecurityEventRepository.java';
s=read(p);
if(!s.includes('org.springframework.data.domain.Page')){
  s=s.replace('import java.util.List;\r\n', 'import java.util.List;\r\nimport org.springframework.data.domain.Page;\r\nimport org.springframework.data.domain.Pageable;\r\n');
  s=s.replace('import java.util.List;\n', 'import java.util.List;\nimport org.springframework.data.domain.Page;\nimport org.springframework.data.domain.Pageable;\n');
}
if(!s.includes('Page<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc')){
  s=s.replace('    List<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc(String examId);', '    List<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc(String examId);\r\n\r\n    Page<ExamSecurityEventEntity> findByExamIdOrderByServerReceivedAtDesc(String examId, Pageable pageable);');
}
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/audit/service/ExamSecurityAuditService.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ErrorCode;\r\n', 'import com.mindmark.server.common.api.ErrorCode;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
  s=s.replace('import com.mindmark.server.common.api.ErrorCode;\n', 'import com.mindmark.server.common.api.ErrorCode;\nimport com.mindmark.server.common.api.PageResponse;\n');
}
if(!s.includes('import org.springframework.data.domain.PageRequest;')){
  s=s.replace('import org.springframework.stereotype.Service;\r\n', 'import org.springframework.data.domain.PageRequest;\r\nimport org.springframework.data.domain.Sort;\r\nimport org.springframework.stereotype.Service;\r\n');
  s=s.replace('import org.springframework.stereotype.Service;\n', 'import org.springframework.data.domain.PageRequest;\nimport org.springframework.data.domain.Sort;\nimport org.springframework.stereotype.Service;\n');
}
if(!s.includes('listExamEventsPage')){
  const insert = `\r\n    @Transactional(readOnly = true)\r\n    public PageResponse<ExamSecurityEventResponse> listExamEventsPage(String examId, Integer page, Integer pageSize) {\r\n        ExamEntity exam = examRepository.findWithDetailsById(examId)\r\n            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));\r\n        classScopeService.requireCanAccessExam(exam);\r\n        PageRequest pageRequest = PageRequest.of(\r\n            PageResponse.normalizePage(page) - 1,\r\n            PageResponse.normalizePageSize(pageSize),\r\n            Sort.by(Sort.Direction.DESC, "serverReceivedAt")\r\n        );\r\n        return PageResponse.fromPage(\r\n            examSecurityEventRepository.findByExamIdOrderByServerReceivedAtDesc(exam.getId(), pageRequest)\r\n                .map(this::toResponse)\r\n        );\r\n    }\r\n`;
  s=s.replace(/    @Transactional\(readOnly = true\)\r?\n    public long countExamEvents/, insert+'\r\n    @Transactional(readOnly = true)\r\n    public long countExamEvents', s);
}
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/audit/web/ExamSecurityAuditController.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\r\n', 'import com.mindmark.server.common.api.ApiResponse;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\n', 'import com.mindmark.server.common.api.ApiResponse;\nimport com.mindmark.server.common.api.PageResponse;\n');
}
s=s.replace('import java.util.List;\r\n','').replace('import java.util.List;\n','');
if(!s.includes('RequestParam')){
  s=s.replace('import org.springframework.web.bind.annotation.RequestMapping;\r\n', 'import org.springframework.web.bind.annotation.RequestMapping;\r\nimport org.springframework.web.bind.annotation.RequestParam;\r\n');
  s=s.replace('import org.springframework.web.bind.annotation.RequestMapping;\n', 'import org.springframework.web.bind.annotation.RequestMapping;\nimport org.springframework.web.bind.annotation.RequestParam;\n');
}
s=s.replace(/    @GetMapping\r?\n    public ApiResponse<List<ExamSecurityEventResponse>> listExamEvents\(@PathVariable String examId\) \{\r?\n        return ApiResponse\.success\(examSecurityAuditService\.listExamEvents\(examId\)\);\r?\n    }/, `    @GetMapping\r\n    public ApiResponse<PageResponse<ExamSecurityEventResponse>> listExamEvents(\r\n        @PathVariable String examId,\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "20") int pageSize\r\n    ) {\r\n        return ApiResponse.success(examSecurityAuditService.listExamEventsPage(examId, page, pageSize));\r\n    }`);
write(p,s);
