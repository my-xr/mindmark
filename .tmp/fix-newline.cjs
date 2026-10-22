const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/        String requirement = safe\(request\.requirement\(\)\)\r?\n            \+ "\r?\n请只生成 1 道题，这是本次任务的第 " \+ index \+ "\/" \+ total\r?\n            \+ " 道。题干、选项和解析必须与本批次其他题有明显差异，避免重复。";/, '        String requirement = safe(request.requirement())\r\n            + "\\n请只生成 1 道题，这是本次任务的第 " + index + "/" + total\r\n            + " 道。题干、选项和解析必须与本批次其他题有明显差异，避免重复。";');
fs.writeFileSync(p,s,'utf8');
