const fs = require('fs');
function read(p){ return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); }
function write(p, s){ fs.writeFileSync(p, s, { encoding: 'utf8' }); }
function replaceRegex(s, re, b, file){
  if(!re.test(s)){ throw new Error(`pattern not found in ${file}: ${re}`); }
  return s.replace(re,b);
}
let p,s;

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperResponseMapper.java';
s=read(p);
s=s.replace(/private PaperQuestionResponse toPaperQuestionResponse/g, 'public PaperQuestionResponse toPaperQuestionResponse');
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
s=read(p);
s=replaceRegex(s, /        Page<PaperEntity> paperPage = paperRepository\.findAll\(buildSpecification\(keyword\), pageRequest\);\r?\n\r?\n        return new PageResponse<>\(\r?\n            paperPage\.getContent\(\)\.stream\(\)\.map\(responseMapper::toResponse\)\.toList\(\),\r?\n            paperPage\.getTotalElements\(\),\r?\n            paperPage\.getNumber\(\) \+ 1,\r?\n            paperPage\.getSize\(\)\r?\n        \);\r?\n    }\r?\n\r?\n    @Transactional\(readOnly = true\)\r?\n    public PaperResponse getPaper\(String paperId\) \{/, `        Page<PaperEntity> paperPage = paperRepository.findAll(buildSpecification(keyword), pageRequest);\r\n\r\n        return PageResponse.fromPage(paperPage.map(responseMapper::toResponse));\r\n    }\r\n\r\n    @Transactional(readOnly = true)\r\n    public PageResponse<com.mindmark.server.modules.paper.dto.PaperQuestionResponse> listPaperQuestions(String paperId, int page, int pageSize) {\r\n        if (!paperRepository.existsById(paperId)) {\r\n            throw new BusinessException(ErrorCode.NOT_FOUND, "Paper not found");\r\n        }\r\n        PageRequest pageRequest = PageRequest.of(\r\n            Math.max(page, 1) - 1,\r\n            Math.min(Math.max(pageSize, 1), 100),\r\n            Sort.by(Sort.Direction.ASC, "orderIndex")\r\n        );\r\n        Page<PaperQuestionEntity> questionPage = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId, pageRequest);\r\n\r\n        return PageResponse.fromPage(questionPage.map(responseMapper::toPaperQuestionResponse));\r\n    }\r\n\r\n    @Transactional(readOnly = true)\r\n    public PaperResponse getPaper(String paperId) {`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/web/PaperController.java';
s=read(p);
if(!s.includes('PaperQuestionResponse')){
  s=s.replace('import com.mindmark.server.modules.paper.dto.PaperResponse;\r\n', 'import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;\r\nimport com.mindmark.server.modules.paper.dto.PaperResponse;\r\n');
}
if(!s.includes('listPaperQuestions(')){
  s=replaceRegex(s, /    @PostMapping\("\/\{paperId\}\/questions"\)\r?\n    public ApiResponse<PaperResponse> addQuestionToPaper\(/, `    @GetMapping("/{paperId}/questions")\r\n    public ApiResponse<PageResponse<PaperQuestionResponse>> listPaperQuestions(\r\n        @PathVariable String paperId,\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "20") int pageSize\r\n    ) {\r\n        return ApiResponse.success(paperService.listPaperQuestions(paperId, page, pageSize));\r\n    }\r\n\r\n    @PostMapping("/{paperId}/questions")\r\n    public ApiResponse<PaperResponse> addQuestionToPaper(`, p);
}
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiQuestionGenerationTaskService.java';
s=read(p);
s=replaceRegex(s, /        return new PageResponse<>\(\r?\n            taskPage\.getContent\(\)\.stream\(\)\.map\(this::toResponse\)\.toList\(\),\r?\n            taskPage\.getTotalElements\(\),\r?\n            safePage,\r?\n            safePageSize\r?\n        \);/, '        return PageResponse.fromPage(taskPage.map(this::toResponse));', p);
write(p,s);
