const fs = require('fs');
const path = 'scripts/run-local-acceptance.ps1';
let s = fs.readFileSync(path, 'utf8');
const block = `    Invoke-AcceptanceStep "teacher dashboard aggregate smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-dashboard-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
`;
if (!s.includes('teacher dashboard aggregate smoke')) {
  s = s.replace('    Invoke-AcceptanceStep "pagination contract API smoke" {', block + '    Invoke-AcceptanceStep "pagination contract API smoke" {');
}
fs.writeFileSync(path, s, 'utf8');
