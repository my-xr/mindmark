const fs=require('fs');
for (const f of ['apps/mindmark-server/src/main/java/com/mindmark/server/modules/answer/dto/SaveAnswerDraftRequest.java','apps/mindmark-server/src/main/resources/db/migration/V10__exam_lifecycle_constraints.sql']) {
  let s=fs.readFileSync(f,'utf8');
  if (s.charCodeAt(0)===0xfeff) s=s.slice(1);
  fs.writeFileSync(f,s,'utf8');
}
