const fs=require('fs');
const p='scripts/api-smoke/run-100-point-exam-smoke.ps1';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/Assert-True \(\[decimal\]\$autoGraded\.totalScore -le 100\) "system total score does not exceed 100"\r?\n\$summary\.gradingTaskId = \$taskId\r?\n\$summary\.autoGradeStatus = \$autoGraded\.status\r?\n\$summary\.autoGradeTotalScore = \$autoGraded\.totalScore/, '$autoGradeScore = Get-GradingTaskScore $autoGraded\r\nAssert-True ($autoGradeScore -le 100) "system total score does not exceed 100"\r\n$summary.gradingTaskId = $taskId\r\n$summary.autoGradeStatus = $autoGraded.status\r\n$summary.autoGradeTotalScore = $autoGradeScore');
s=s.replace(/Assert-True \(\[decimal\]\$confirmed\.totalScore -le 100\) "confirmed total score does not exceed 100"\r?\n\$summary\.confirmedScore = \$confirmed\.totalScore/, '$confirmedScore = Get-GradingTaskScore $confirmed\r\nAssert-True ($confirmedScore -le 100) "confirmed total score does not exceed 100"\r\n$summary.confirmedScore = $confirmedScore');
fs.writeFileSync(p,s,'utf8');
