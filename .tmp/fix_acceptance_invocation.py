from pathlib import Path
p=Path('scripts/run-local-acceptance.ps1')
text=p.read_text(encoding='utf-8')
start=text.index('function Invoke-ExternalCommand')
end=text.index('$apiV1BaseUrl', start)
new='''function Invoke-ExternalCommand {\n    param(\n        [Parameter(Mandatory = $true)] [string]$Command,\n        [Parameter(Mandatory = $true)] [string[]]$Arguments\n    )\n    & $Command @Arguments\n    if ($LASTEXITCODE -ne 0) {\n        throw "$Command $($Arguments -join ' ') exited with code $LASTEXITCODE"\n    }\n}\n\n'''
text=text[:start]+new+text[end:]
repls={
'Invoke-ExternalCommand mvn -f apps/mindmark-server/pom.xml compile':'Invoke-ExternalCommand "mvn" @("-f", "apps/mindmark-server/pom.xml", "compile")',
'Invoke-ExternalCommand pnpm --filter mindmark-web typecheck':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "typecheck")',
'Invoke-ExternalCommand pnpm --filter mindmark-web lint':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "lint")',
'Invoke-ExternalCommand pnpm --filter mindmark-web format:check':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "format:check")',
'Invoke-ExternalCommand pnpm --filter mindmark-web stylelint':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "stylelint")',
'Invoke-ExternalCommand pnpm --filter mindmark-web build':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "build")',
'Invoke-ExternalCommand pnpm --filter mindmark-web exec playwright test e2e/teacher-pages.spec.ts e2e/student-exam-security.spec.ts e2e/admin-governance.spec.ts --project=teacher-chrome --reporter=line':'Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "exec", "playwright", "test", "e2e/teacher-pages.spec.ts", "e2e/student-exam-security.spec.ts", "e2e/admin-governance.spec.ts", "--project=teacher-chrome", "--reporter=line")',
'Invoke-ExternalCommand powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-question-paper-smoke.ps1 -BaseUrl $BaseUrl -TeacherUsername $TeacherUsername -TeacherPassword $TeacherPassword':'Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-question-paper-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)',
'Invoke-ExternalCommand powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-account-system-smoke.ps1 -BaseUrl $apiV1BaseUrl -TeacherUsername $TeacherUsername -TeacherPassword $TeacherPassword':'Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-account-system-smoke.ps1", "-BaseUrl", $apiV1BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)',
'Invoke-ExternalCommand powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-admin-governance-smoke.ps1 -BaseUrl $apiV1BaseUrl -AdminUsername $AdminUsername -AdminPassword $AdminPassword':'Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-admin-governance-smoke.ps1", "-BaseUrl", $apiV1BaseUrl, "-AdminUsername", $AdminUsername, "-AdminPassword", $AdminPassword)',
'Invoke-ExternalCommand powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-exam-loop-smoke.ps1 -BaseUrl $BaseUrl -TeacherUsername $TeacherUsername -TeacherPassword $TeacherPassword':'Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-exam-loop-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)',
'Invoke-ExternalCommand powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-ai-question-loop-smoke.ps1 -BaseUrl $BaseUrl -TeacherUsername $TeacherUsername -TeacherPassword $TeacherPassword':'Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-ai-question-loop-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)'
}
for a,b in repls.items():
 if a not in text: print('missing old:',a[:80])
 text=text.replace(a,b)
p.write_text(text, encoding='utf-8', newline='\n')
