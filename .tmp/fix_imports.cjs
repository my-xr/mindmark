const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/web/ExamController.java';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
if(!s.includes('import com.mindmark.server.common.api.PageResponse;')){
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\r\n', 'import com.mindmark.server.common.api.ApiResponse;\r\nimport com.mindmark.server.common.api.PageResponse;\r\n');
  s=s.replace('import com.mindmark.server.common.api.ApiResponse;\n', 'import com.mindmark.server.common.api.ApiResponse;\nimport com.mindmark.server.common.api.PageResponse;\n');
}
if(!s.includes('import org.springframework.web.bind.annotation.RequestParam;')){
  s=s.replace('import org.springframework.web.bind.annotation.RequestMapping;\r\n', 'import org.springframework.web.bind.annotation.RequestMapping;\r\nimport org.springframework.web.bind.annotation.RequestParam;\r\n');
  s=s.replace('import org.springframework.web.bind.annotation.RequestMapping;\n', 'import org.springframework.web.bind.annotation.RequestMapping;\nimport org.springframework.web.bind.annotation.RequestParam;\n');
}
fs.writeFileSync(p,s,'utf8');
