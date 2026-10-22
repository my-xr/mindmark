const fs = require('fs');
let p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('existsByPaper_Id')) {
  s = s.replace('    Optional<ExamEntity> findWithDetailsById(String id);\n', '    Optional<ExamEntity> findWithDetailsById(String id);\n\n    boolean existsByPaper_Id(String paperId);\n');
  fs.writeFileSync(p, s, 'utf8');
}

p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
s = fs.readFileSync(p, 'utf8');
if (!s.includes('com.mindmark.server.modules.exam.repository.ExamRepository')) {
  s = s.replace('import com.mindmark.server.modules.auth.domain.RoleCode;\n', 'import com.mindmark.server.modules.auth.domain.RoleCode;\nimport com.mindmark.server.modules.exam.repository.ExamRepository;\n');
}
if (!s.includes('private final ExamRepository examRepository;')) {
  s = s.replace('    private final CourseRepository courseRepository;\n    private final PaperResponseMapper responseMapper;', '    private final CourseRepository courseRepository;\n    private final ExamRepository examRepository;\n    private final PaperResponseMapper responseMapper;');
}
if (!s.includes('        ExamRepository examRepository,\n        PaperResponseMapper responseMapper,')) {
  s = s.replace('        QuestionRepository questionRepository,\n        CourseRepository courseRepository,\n        PaperResponseMapper responseMapper,', '        QuestionRepository questionRepository,\n        CourseRepository courseRepository,\n        ExamRepository examRepository,\n        PaperResponseMapper responseMapper,');
}
if (!s.includes('        this.examRepository = examRepository;')) {
  s = s.replace('        this.courseRepository = courseRepository;\n        this.responseMapper = responseMapper;', '        this.courseRepository = courseRepository;\n        this.examRepository = examRepository;\n        this.responseMapper = responseMapper;');
}
if (!s.includes('public void deletePaper(String paperId, AuthUserEntity operator)')) {
  const method = `\n    @Transactional\n    public void deletePaper(String paperId, AuthUserEntity operator) {\n        requirePaperWriteRole(operator);\n        PaperEntity paper = findPaper(paperId);\n        ensurePaperEditable(paper);\n        if (examRepository.existsByPaper_Id(paperId)) {\n            throw new BusinessException(ErrorCode.CONFLICT, \"Paper has created exams and cannot be deleted\");\n        }\n        paperRepository.delete(paper);\n    }\n`;
  s = s.replace('    @Transactional\n    public PaperResponse updateStatus', method + '\n    @Transactional\n    public PaperResponse updateStatus');
}
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/web/PaperController.java';
s = fs.readFileSync(p, 'utf8');
if (!s.includes('public ApiResponse<Boolean> deletePaper(')) {
  const method = `\n    @DeleteMapping(\"/{paperId}\")\n    public ApiResponse<Boolean> deletePaper(\n        @RequestHeader(value = \"Authorization\", required = false) String authorization,\n        @PathVariable String paperId\n    ) {\n        paperService.deletePaper(\n            paperId,\n            authContextService.getCurrentAuthUser(authorization, null, null)\n        );\n        return ApiResponse.success(true);\n    }\n`;
  s = s.replace('\n    @DeleteMapping("/{paperId}/questions/{questionId}")', method + '\n    @DeleteMapping("/{paperId}/questions/{questionId}")');
}
fs.writeFileSync(p, s, 'utf8');
