const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')}
function write(p,s){fs.writeFileSync(p,s,'utf8')}
let p,s;

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/review/service/ReviewService.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ErrorCode;\r\n','import com.mindmark.server.common.api.ErrorCode;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n')
     .replace('import com.mindmark.server.common.api.ErrorCode;\n','import com.mindmark.server.common.api.ErrorCode;\nimport com.mindmark.server.common.api.PageResponse;\n');
}
if(!s.includes('import com.mindmark.server.modules.auth.domain.RoleCode;')){
  s=s.replace('import com.mindmark.server.modules.auth.domain.AuthUserEntity;\r\n','import com.mindmark.server.modules.auth.domain.AuthUserEntity;\r\nimport com.mindmark.server.modules.auth.domain.RoleCode;\r\n')
     .replace('import com.mindmark.server.modules.auth.domain.AuthUserEntity;\n','import com.mindmark.server.modules.auth.domain.AuthUserEntity;\nimport com.mindmark.server.modules.auth.domain.RoleCode;\n');
}
if(!s.includes('import java.util.Set;')){
  s=s.replace('import java.util.List;\r\n','import java.util.List;\r\nimport java.util.Set;\r\n')
     .replace('import java.util.List;\n','import java.util.List;\nimport java.util.Set;\n');
}
if(!s.includes('import org.springframework.data.domain.PageRequest;')){
  s=s.replace('import org.springframework.stereotype.Service;\r\n','import org.springframework.data.domain.PageRequest;\r\nimport org.springframework.data.domain.Sort;\r\nimport org.springframework.stereotype.Service;\r\n')
     .replace('import org.springframework.stereotype.Service;\n','import org.springframework.data.domain.PageRequest;\nimport org.springframework.data.domain.Sort;\nimport org.springframework.stereotype.Service;\n');
}
s=s.replace(/    @Transactional\r?\n    public List<ExamReviewReportResponse> listReports\(\) \{[\s\S]*?\r?\n    }\r?\n\r?\n    @Transactional\r?\n    public ExamReviewReportResponse getReport/, `    @Transactional\r\n    public PageResponse<ExamReviewReportResponse> listReports(Integer page, Integer pageSize) {\r\n        AuthUserEntity currentUser = classScopeService.currentUser();\r\n        boolean admin = currentUser.getRoles().contains(RoleCode.ADMIN);\r\n        Set<String> visibleClassIds = classScopeService.visibleClassIds();\r\n        if (!admin && visibleClassIds.isEmpty()) {\r\n            return PageResponse.empty(page, pageSize);\r\n        }\r\n\r\n        PageRequest pageRequest = PageRequest.of(\r\n            PageResponse.normalizePage(page) - 1,\r\n            PageResponse.normalizePageSize(pageSize),\r\n            Sort.by(Sort.Direction.DESC, "updatedAt")\r\n        );\r\n        var examPage = examRepository.pageVisibleExamsWithGradingTasks(\r\n            admin,\r\n            admin ? List.of("__ADMIN_SCOPE__") : visibleClassIds,\r\n            pageRequest\r\n        );\r\n        return PageResponse.fromPage(examPage.map(this::buildReport));\r\n    }\r\n\r\n    @Transactional\r\n    public ExamReviewReportResponse getReport`, s);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/review/web/ReviewController.java';
s=read(p);
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\r\n','import com.mindmark.server.common.api.ApiResponse;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n')
     .replace('import com.mindmark.server.common.api.ApiResponse;\n','import com.mindmark.server.common.api.ApiResponse;\nimport com.mindmark.server.common.api.PageResponse;\n');
}
s=s.replace('import java.util.List;\r\n','').replace('import java.util.List;\n','');
if(!s.includes('import org.springframework.web.bind.annotation.RequestParam;')){
  s=s.replace('import org.springframework.web.bind.annotation.RestController;\r\n','import org.springframework.web.bind.annotation.RequestParam;\r\nimport org.springframework.web.bind.annotation.RestController;\r\n')
     .replace('import org.springframework.web.bind.annotation.RestController;\n','import org.springframework.web.bind.annotation.RequestParam;\nimport org.springframework.web.bind.annotation.RestController;\n');
}
s=s.replace(/    @GetMapping\("\/api\/v1\/exams\/reviews"\)\r?\n    public ApiResponse<List<ExamReviewReportResponse>> listReports\(\) \{\r?\n        return ApiResponse\.success\(reviewService\.listReports\(\)\);\r?\n    }/, `    @GetMapping("/api/v1/exams/reviews")\r\n    public ApiResponse<PageResponse<ExamReviewReportResponse>> listReports(\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "20") int pageSize\r\n    ) {\r\n        return ApiResponse.success(reviewService.listReports(page, pageSize));\r\n    }`);
write(p,s);
