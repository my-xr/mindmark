param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminUsername = "teacher@mindmark.local",
    [string]$AdminPassword = "dev-password",
    [string]$TeacherUsername = "teacher@mindmark.local",
    [string]$TeacherPassword = "dev-password",
    [switch]$SkipHealth,
    [switch]$SkipBackendCompile,
    [switch]$SkipFrontendQuality,
    [switch]$SkipFrontendBuild,
    [switch]$SkipE2E,
    [switch]$SkipSmoke,
    [switch]$IncludeAiSmoke
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$startedAt = Get-Date
$summary = New-Object System.Collections.Generic.List[object]

function Write-Section([string]$Message) {
    Write-Host "`n[acceptance] $Message" -ForegroundColor Cyan
}

function Invoke-AcceptanceStep {
    param(
        [Parameter(Mandatory = $true)] [string]$Name,
        [Parameter(Mandatory = $true)] [scriptblock]$Command
    )

    $stepStart = Get-Date
    Write-Section "START $Name"
    try {
        & $Command
        if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
            throw "$Name exited with code $LASTEXITCODE"
        }
        $duration = [Math]::Round(((Get-Date) - $stepStart).TotalSeconds, 1)
        $summary.Add([pscustomobject]@{ step = $Name; status = "PASS"; seconds = $duration }) | Out-Null
        Write-Host "[acceptance] PASS $Name (${duration}s)" -ForegroundColor Green
    }
    catch {
        $duration = [Math]::Round(((Get-Date) - $stepStart).TotalSeconds, 1)
        $summary.Add([pscustomobject]@{ step = $Name; status = "FAIL"; seconds = $duration; error = $_.Exception.Message }) | Out-Null
        Write-Host "[acceptance] FAIL $Name (${duration}s)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        throw
    }
}

function Invoke-ExternalCommand {
    param(
        [Parameter(Mandatory = $true)] [string]$Command,
        [Parameter(Mandatory = $true)] [string[]]$Arguments
    )
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command $($Arguments -join ' ') exited with code $LASTEXITCODE"
    }
}

$apiV1BaseUrl = "$BaseUrl/api/v1"
$env:MINDMARK_ADMIN_USERNAME = $AdminUsername
$env:MINDMARK_ADMIN_PASSWORD = $AdminPassword
$env:MINDMARK_TEACHER_USERNAME = $TeacherUsername
$env:MINDMARK_TEACHER_PASSWORD = $TeacherPassword
$env:VITE_USE_MOCK = "false"
$env:VITE_API_BASE_URL = "/api"

if (-not $SkipHealth) {
    Invoke-AcceptanceStep "backend health" {
        $health = Invoke-RestMethod -Method Get -Uri "$apiV1BaseUrl/system/health" -TimeoutSec 10
        if ($health.code -and $health.code -ne "0") {
            throw "Unexpected health response code: $($health.code)"
        }
        Write-Host ($health | ConvertTo-Json -Depth 8)
    }
}

if (-not $SkipBackendCompile) {
    Invoke-AcceptanceStep "backend compile" {
        Invoke-ExternalCommand "mvn" @("-f", "apps/mindmark-server/pom.xml", "compile")
    }
}

if (-not $SkipFrontendQuality) {
    Invoke-AcceptanceStep "frontend typecheck" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "typecheck")
    }
    Invoke-AcceptanceStep "frontend lint" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "lint")
    }
    Invoke-AcceptanceStep "frontend format check" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "format:check")
    }
    Invoke-AcceptanceStep "frontend stylelint" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "stylelint")
    }
}

if (-not $SkipFrontendBuild) {
    Invoke-AcceptanceStep "frontend build" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "build")
    }
}

if (-not $SkipE2E) {
    Invoke-AcceptanceStep "teacher, student and admin E2E" {
        Invoke-ExternalCommand "pnpm" @("--filter", "mindmark-web", "exec", "playwright", "test", "e2e/teacher-pages.spec.ts", "e2e/student-exam-security.spec.ts", "e2e/admin-governance.spec.ts", "--project=teacher-chrome", "--reporter=line")
    }
}

if (-not $SkipSmoke) {
    Invoke-AcceptanceStep "question and paper API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-question-paper-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
    Invoke-AcceptanceStep "account API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-account-system-smoke.ps1", "-BaseUrl", $apiV1BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
    Invoke-AcceptanceStep "admin governance API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-admin-governance-smoke.ps1", "-BaseUrl", $apiV1BaseUrl, "-AdminUsername", $AdminUsername, "-AdminPassword", $AdminPassword)
    }
    Invoke-AcceptanceStep "exam loop API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-exam-loop-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
    Invoke-AcceptanceStep "teacher dashboard aggregate smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-dashboard-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
    Invoke-AcceptanceStep "pagination contract API smoke" {
        Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-pagination-contract-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
    }
    if ($IncludeAiSmoke) {
        Invoke-AcceptanceStep "AI question loop smoke" {
            Invoke-ExternalCommand "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/api-smoke/run-ai-question-loop-smoke.ps1", "-BaseUrl", $BaseUrl, "-TeacherUsername", $TeacherUsername, "-TeacherPassword", $TeacherPassword)
        }
    }
    else {
        $summary.Add([pscustomobject]@{ step = "AI question loop smoke"; status = "SKIPPED"; seconds = 0; error = "Use -IncludeAiSmoke to run real provider smoke." }) | Out-Null
        Write-Host "[acceptance] SKIP AI question loop smoke (use -IncludeAiSmoke to run real provider smoke)" -ForegroundColor Yellow
    }
}

$totalSeconds = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 1)
Write-Section "SUMMARY"
$summary | Format-Table -AutoSize
Write-Host "[acceptance] DONE total=${totalSeconds}s" -ForegroundColor Green