const fs=require('fs');
const p='scripts/api-smoke/run-exam-loop-smoke.ps1';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
s=s.replace(/\$securityEvents = \(Invoke-MindMarkApi GET "\/api\/v1\/exams\/\$\(\$normalExam\.id\)\/security-events" \$null \$teacherHeaders\)\.data\r?\nAssert-True \(\(\$securityEvents \| Where-Object \{ \$_\.id -eq \$securityEvent\.id \} \| Select-Object -First 1\) -ne \$null\) "teacher can query reported security event"/, `$securityEventsPage = (Invoke-MindMarkApi GET "/api/v1/exams/$($normalExam.id)/security-events?page=1&pageSize=20" $null $teacherHeaders).data\nAssert-True (($securityEventsPage.items | Where-Object { $_.id -eq $securityEvent.id } | Select-Object -First 1) -ne $null) "teacher can query reported security event"`);
fs.writeFileSync(p,s,'utf8');
