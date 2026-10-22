const fs = require('fs');
function read(p){ return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); }
function write(p, s){ fs.writeFileSync(p, s, { encoding: 'utf8' }); }
function replaceChecked(s, a, b, file){
  if(!s.includes(a)){ throw new Error(`pattern not found in ${file}: ${a.slice(0,80)}`); }
  return s.replace(a,b);
}
let p,s;

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionService.java';
s=read(p);
s=replaceChecked(s, `        Page<QuestionEntity> page = questionRepository.findAll(buildSpecification(query), pageRequest);\r\n\r\n        return new PageResponse<>(\r\n            page.getContent().stream().map(responseMapper::toResponse).toList(),\r\n            page.getTotalElements(),\r\n            page.getNumber() + 1,\r\n            page.getSize()\r\n        );\r\n`, `        Page<QuestionEntity> page = questionRepository.findAll(buildSpecification(query), pageRequest);\r\n\r\n        return PageResponse.fromPage(page.map(responseMapper::toResponse));\r\n`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/repository/PaperQuestionRepository.java';
s=read(p);
s=replaceChecked(s, `import java.util.List;\r\nimport org.springframework.data.jpa.repository.JpaRepository;\r\n`, `import java.util.List;\r\nimport org.springframework.data.domain.Page;\r\nimport org.springframework.data.domain.Pageable;\r\nimport org.springframework.data.jpa.repository.JpaRepository;\r\n`, p);
s=replaceChecked(s, `    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);\r\n`, `    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);\r\n\r\n    Page<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId, Pageable pageable);\r\n`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperResponseMapper.java';
s=read(p);
s=replaceChecked(s, `    private PaperQuestionResponse toPaperQuestionResponse(PaperQuestionEntity entity) {\r\n`, `    public PaperQuestionResponse toPaperQuestionResponse(PaperQuestionEntity entity) {\r\n`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
s=read(p);
s=replaceChecked(s, `        Page<PaperEntity> paperPage = paperRepository.findAll(buildSpecification(keyword), pageRequest);\r\n\r\n        return new PageResponse<>(\r\n            paperPage.getContent().stream().map(responseMapper::toResponse).toList(),\r\n            paperPage.getTotalElements(),\r\n            paperPage.getNumber() + 1,\r\n            paperPage.getSize()\r\n        );\r\n    }\r\n\r\n    @Transactional(readOnly = true)\r\n    public PaperResponse getPaper(String paperId) {\r\n`, `        Page<PaperEntity> paperPage = paperRepository.findAll(buildSpecification(keyword), pageRequest);\r\n\r\n        return PageResponse.fromPage(paperPage.map(responseMapper::toResponse));\r\n    }\r\n\r\n    @Transactional(readOnly = true)\r\n    public PageResponse<com.mindmark.server.modules.paper.dto.PaperQuestionResponse> listPaperQuestions(String paperId, int page, int pageSize) {\r\n        if (!paperRepository.existsById(paperId)) {\r\n            throw new BusinessException(ErrorCode.NOT_FOUND, "Paper not found");\r\n        }\r\n        PageRequest pageRequest = PageRequest.of(\r\n            Math.max(page, 1) - 1,\r\n            Math.min(Math.max(pageSize, 1), 100),\r\n            Sort.by(Sort.Direction.ASC, "orderIndex")\r\n        );\r\n        Page<PaperQuestionEntity> questionPage = paperQuestionRepository.findByPaper_IdOrderByOrderIndexAsc(paperId, pageRequest);\r\n\r\n        return PageResponse.fromPage(questionPage.map(responseMapper::toPaperQuestionResponse));\r\n    }\r\n\r\n    @Transactional(readOnly = true)\r\n    public PaperResponse getPaper(String paperId) {\r\n`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/web/PaperController.java';
s=read(p);
s=replaceChecked(s, `import com.mindmark.server.modules.paper.dto.PaperResponse;\r\n`, `import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;\r\nimport com.mindmark.server.modules.paper.dto.PaperResponse;\r\n`, p);
s=replaceChecked(s, `    @PostMapping("/{paperId}/questions")\r\n    public ApiResponse<PaperResponse> addQuestionToPaper(\r\n`, `    @GetMapping("/{paperId}/questions")\r\n    public ApiResponse<PageResponse<PaperQuestionResponse>> listPaperQuestions(\r\n        @PathVariable String paperId,\r\n        @RequestParam(defaultValue = "1") int page,\r\n        @RequestParam(defaultValue = "20") int pageSize\r\n    ) {\r\n        return ApiResponse.success(paperService.listPaperQuestions(paperId, page, pageSize));\r\n    }\r\n\r\n    @PostMapping("/{paperId}/questions")\r\n    public ApiResponse<PaperResponse> addQuestionToPaper(\r\n`, p);
write(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiQuestionGenerationTaskService.java';
s=read(p);
s=replaceChecked(s, `        return new PageResponse<>(\r\n            taskPage.getContent().stream().map(this::toResponse).toList(),\r\n            taskPage.getTotalElements(),\r\n            safePage,\r\n            safePageSize\r\n        );\r\n`, `        return PageResponse.fromPage(taskPage.map(this::toResponse));\r\n`, p);
write(p,s);
