const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/service/ExamService.java';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
function addAfter(anchor, line){ if(!s.includes(line.trim())) { s=s.replace(anchor, anchor+line); } }
addAfter('import com.mindmark.server.common.api.ErrorCode;\r\n', 'import com.mindmark.server.common.api.PageResponse;\r\n');
addAfter('import com.mindmark.server.common.api.ErrorCode;\n', 'import com.mindmark.server.common.api.PageResponse;\n');
addAfter('import com.mindmark.server.modules.auth.domain.AuthUserEntity;\r\n', 'import com.mindmark.server.modules.auth.domain.RoleCode;\r\n');
addAfter('import com.mindmark.server.modules.auth.domain.AuthUserEntity;\n', 'import com.mindmark.server.modules.auth.domain.RoleCode;\n');
addAfter('import java.util.List;\r\n', 'import java.util.Set;\r\n');
addAfter('import java.util.List;\n', 'import java.util.Set;\n');
if(!s.includes('import org.springframework.data.domain.PageRequest;')){
  s=s.replace('import org.springframework.stereotype.Service;\r\n', 'import org.springframework.data.domain.PageRequest;\r\nimport org.springframework.data.domain.Sort;\r\nimport org.springframework.stereotype.Service;\r\n');
  s=s.replace('import org.springframework.stereotype.Service;\n', 'import org.springframework.data.domain.PageRequest;\nimport org.springframework.data.domain.Sort;\nimport org.springframework.stereotype.Service;\n');
}
fs.writeFileSync(p,s,'utf8');
