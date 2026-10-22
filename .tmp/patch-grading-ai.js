const fs = require('fs');
function writeUtf8NoBom(p, s){ fs.writeFileSync(p, s.replace(/^\uFEFF/, ''), {encoding:'utf8'}); }
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s=fs.readFileSync(p,'utf8');
s=s.replace('"ϵͳ�Զ��з֣��Ѱ��ο��𰸡�����Ҫ�������ֵ�ƥ�����Ĭ�Ϸ֡�"','"系统自动判分：已按参考答案、评分点和关键词匹配给出默认分。"');
s=s.replace('"ϵͳ�Զ��з֣�ѧ��δ����Ĭ�� 0 �֣������ʦ�˶ԡ�"','"系统自动判分：学生未作答，默认 0 分，建议教师复核。"');
writeUtf8NoBom(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobProcessor.java';
s=fs.readFileSync(p,'utf8');
s=s.replace('"δ���ÿ��� AI Provider���ѱ���ϵͳ���߷֡�" + summarize(exception.getMessage())','"未配置可用 AI Provider，已保留系统基线分。" + summarize(exception.getMessage())');
s=s.replace('"AI Provider δ���ؿ������֣��ѱ���ϵͳ���߷֡�"','"AI Provider 未返回可用评分，已保留系统基线分。"');
s=s.replaceAll('"�������ɽ�ʦ���ˣ���̨ AI ���ֲ��ٸ��ǳɼ���"','"答卷已由教师复核，后台 AI 评分不再覆盖成绩。"');
s=s.replace('value.replaceAll("\\s+", " ")','value.replaceAll("\\\\s+", " ")');
writeUtf8NoBom(p,s);

p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingTaskRepository.java';
s=fs.readFileSync(p,'utf8');
s=s.replaceAll('"exam", "exam.classIds", "exam.paper", "answerSheet", "items", "items.question"','"exam", "exam.classIds", "exam.paper", "answerSheet", "answerSheet.items", "items", "items.question"');
writeUtf8NoBom(p,s);

p='apps/mindmark-server/src/main/resources/application.yml';
s=fs.readFileSync(p,'utf8');
if (!s.includes('async-enabled: ${MINDMARK_AI_GRADING_ASYNC_ENABLED:true}')) {
  s=s.replace('    grading:\r\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}\r\n', '    grading:\r\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}\r\n      async-enabled: ${MINDMARK_AI_GRADING_ASYNC_ENABLED:true}\r\n      recover-initial-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_INITIAL_DELAY_MS:60000}\r\n      recover-fixed-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_FIXED_DELAY_MS:120000}\r\n');
  s=s.replace('    grading:\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}\n', '    grading:\n      provider-enabled: ${MINDMARK_AI_GRADING_PROVIDER_ENABLED:true}\n      async-enabled: ${MINDMARK_AI_GRADING_ASYNC_ENABLED:true}\n      recover-initial-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_INITIAL_DELAY_MS:60000}\n      recover-fixed-delay-ms: ${MINDMARK_AI_GRADING_RECOVER_FIXED_DELAY_MS:120000}\n');
}
writeUtf8NoBom(p,s);
