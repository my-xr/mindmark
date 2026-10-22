from pathlib import Path
p = Path('scripts/run-local-acceptance.ps1')
s = p.read_text(encoding='utf-8')
needle = '''    Invoke-AcceptanceStep "exam loop API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-exam-loop-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
'''
insert = needle + '''    Invoke-AcceptanceStep "pagination contract API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-pagination-contract-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
'''
if needle not in s:
    raise SystemExit('acceptance insertion point not found')
s = s.replace(needle, insert)
p.write_text(s, encoding='utf-8')
