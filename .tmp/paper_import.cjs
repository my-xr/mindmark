const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
if(!s.includes('import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;')){
  s=s.replace('import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\r\n', 'import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\r\nimport com.mindmark.server.modules.paper.dto.PaperQuestionResponse;\r\n')
    .replace('import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\n', 'import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\nimport com.mindmark.server.modules.paper.dto.PaperQuestionResponse;\n');
}
s=s.replace('public PageResponse<com.mindmark.server.modules.paper.dto.PaperQuestionResponse> listPaperQuestions(String paperId, int page, int pageSize) {', 'public PageResponse<PaperQuestionResponse> listPaperQuestions(String paperId, int page, int pageSize) {');
fs.writeFileSync(p,s,'utf8');
