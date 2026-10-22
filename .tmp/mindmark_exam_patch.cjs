const fs = require('fs');
function read(p){ return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); }
function write(p, s){ fs.writeFileSync(p, s, { encoding: 'utf8' }); }
let p,s;

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java';
s=read(p);
if(!s.includes('pageVisibleExams(')){
  const insert = `\r\n    @EntityGraph(attributePaths = {"paper", "classIds"})\r\n    @Query(\r\n        value = """\r\n            select exam\r\n            from ExamEntity exam\r\n            where (\r\n                :admin = true\r\n                or not exists (\r\n                    select classId\r\n                    from ExamEntity scopedExam join scopedExam.classIds classId\r\n                    where scopedExam = exam and classId not in :visibleClassIds\r\n                )\r\n            )\r\n            order by exam.updatedAt desc\r\n            """,\r\n        countQuery = """\r\n            select count(exam)\r\n            from ExamEntity exam\r\n            where (\r\n                :admin = true\r\n                or not exists (\r\n                    select classId\r\n                    from ExamEntity scopedExam join scopedExam.classIds classId\r\n                    where scopedExam = exam and classId not in :visibleClassIds\r\n                )\r\n            )\r\n            """\r\n    )\r\n    Page<ExamEntity> pageVisibleExams(\r\n        @Param("admin") boolean admin,\r\n        @Param("visibleClassIds") Collection<String> visibleClassIds,\r\n        Pageable pageable\r\n    );\r\n`;
  s=s.replace(/\r?\n}\s*$/, insert+'\r\n}\r\n');
}
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/service/ExamService.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ErrorCode;\r\n', 'import com.mindmark.server.common.api.ErrorCode;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
}
if(!s.includes('import com.mindmark.server.modules.auth.domain.RoleCode;')){
  s=s.replace('import com.mindmark.server.modules.auth.domain.AuthUserEntity;\r\n', 'import com.mindmark.server.modules.auth.domain.AuthUserEntity;\r\nimport com.mindmark.server.modules.auth.domain.RoleCode;\r\n');
}
if(!s.includes('import java.util.Set;')){
  s=s.replace('import java.util.UUID;\r\n', 'import java.util.Set;\r\nimport java.util.UUID;\r\n');
}
if(!s.includes('import org.springframework.data.domain.PageRequest;')){
  s=s.replace('import org.springframework.stereotype.Service;\r\n', 'import org.springframework.data.domain.PageRequest;\r\nimport org.springframework.data.domain.Sort;\r\nimport org.springframework.stereotype.Service;\r\n');
}
s=s.replace(/    @Transactional\r?\n    public List<ExamResponse> listExams\(\) \{[\s\S]*?\r?\n    }\r?\n\r?\n    @Transactional\r?\n    public ExamResponse getExam/, `    @Transactional\r\n    public PageResponse<ExamResponse> listExams(Integer page, Integer pageSize) {\r\n        AuthUserEntity currentUser = classScopeService.currentUser();\r\n        boolean admin = currentUser.getRoles().contains(RoleCode.ADMIN);\r\n        Set<String> visibleClassIds = classScopeService.visibleClassIds();\r\n        if (!admin && visibleClassIds.isEmpty()) {\r\n            return PageResponse.empty(page, pageSize);\r\n        }\r\n\r\n        PageRequest pageRequest = PageRequest.of(\r\n            PageResponse.normalizePage(page) - 1,\r\n            PageResponse.normalizePageSize(pageSize),\r\n            Sort.by(Sort.Direction.DESC, "updatedAt")\r\n        );\r\n        OffsetDateTime now = OffsetDateTime.now();\r\n        var examPage = examRepository.pageVisibleExams(\r\n            admin,\r\n            admin ? List.of("__ADMIN_SCOPE__") : visibleClassIds,\r\n            pageRequest\r\n        );\r\n\r\n        return PageResponse.fromPage(examPage.map(exam -> {\r\n            refreshTimeDrivenStatus(exam, now);\r\n            examLifecycleService.refreshAndFinalizeIfEnded(exam, now);\r\n            return responseMapper.toResponse(exam);\r\n        }));\r\n    }\r\n\r\n    @Transactional\r\n    public ExamResponse getExam`, s);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/web/ExamController.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\r\n', 'import com.mindmark.server.common.api.ApiResponse;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
}
s=s.replace('import java.util.List;\r\n', '');
if(!s.includes('import org.springframework.web.bind.annotation.RequestParam;')){
  s=s.replace('import org.springframework.web.bind.annotation.RequestMapping;\r\n', 'import org.springframework.web.bind.annotation.RequestMapping;\r\nimport org.springframework.web.bind.annotation.RequestParam;\r\n');
}
s=s.replace(/    @GetMapping\("\/api\/v1\/exams"\)\r?\n    public ApiResponse<List<ExamResponse>> listExams\(\) \{\r?\n        return ApiResponse\.success\(examService\.listExams\(\)\);\r?\n    }/, `    @GetMapping("/api/v1/exams")\r\n    public ApiResponse<PageResponse<ExamResponse>> listExams(\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "20") int pageSize\r\n    ) {\r\n        return ApiResponse.success(examService.listExams(page, pageSize));\r\n    }`);
write(p,s);
