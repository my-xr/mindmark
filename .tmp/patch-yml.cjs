const fs=require('fs');
const f='apps/mindmark-server/src/main/resources/application.yml';
let s=fs.readFileSync(f,'utf8');
if(!s.includes('async-enabled: ${MINDMARK_AI_GRADING_ASYNC_ENABLED:true}')){
  s=s.replace('    grading:\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}', '    grading:\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}\n      async-enabled: ${MINDMARK_AI_GRADING_ASYNC_ENABLED:true}\n      recover-initial-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_INITIAL_DELAY_MS:60000}\n      recover-fixed-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_FIXED_DELAY_MS:120000}');
}
fs.writeFileSync(f,s,'utf8');