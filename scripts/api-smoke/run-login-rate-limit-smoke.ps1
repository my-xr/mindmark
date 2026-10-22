param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$AttemptCount = 11,
    [int]$RecoveryWaitSeconds = 0
)

$ErrorActionPreference = "Stop"

if ($AttemptCount -lt 11) {
    throw "AttemptCount must be at least 11 to verify the default account limit."
}
if ($RecoveryWaitSeconds -lt 0) {
    throw "RecoveryWaitSeconds must be zero or greater."
}

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) {
        throw "Login rate-limit smoke assertion failed: $Message"
    }
}

$principal = "rate-limit-probe-" + [guid]::NewGuid().ToString("N")
$url = "$BaseUrl/api/v1/auth/login"
$responses = @()

Write-Host "[login-rate-limit-smoke] BaseUrl=$BaseUrl"
Write-Host "[login-rate-limit-smoke] using an ephemeral unknown principal; no existing account is modified"

for ($attempt = 1; $attempt -le $AttemptCount; $attempt++) {
    $body = @{
        username = $principal
        password = "invalid-password"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Method POST -Uri $url `
            -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 30
        $status = [int]$response.StatusCode
    } catch {
        $status = if ($_.Exception.Response) {
            [int]$_.Exception.Response.StatusCode
        } else {
            0
        }
    }

    $responses += [pscustomobject]@{
        Attempt = $attempt
        Status = $status
    }
    Write-Host "[login-rate-limit-smoke] attempt=$attempt status=$status"
}

$firstTen = @($responses | Select-Object -First 10)
$rateLimited = @($responses | Where-Object { $_.Status -eq 429 })

Assert-True ($firstTen.Count -eq 10) "expected at least ten attempts"
Assert-True (@($firstTen | Where-Object { $_.Status -ne 401 }).Count -eq 0) `
    "the first ten unknown-principal attempts must return HTTP 401"
Assert-True ($rateLimited.Count -gt 0) "expected HTTP 429 after the account limit"

if ($RecoveryWaitSeconds -gt 0) {
    Write-Host "[login-rate-limit-smoke] waiting $RecoveryWaitSeconds seconds to verify window recovery"
    Start-Sleep -Seconds $RecoveryWaitSeconds
    $body = @{
        username = $principal
        password = "invalid-password"
    } | ConvertTo-Json
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Method POST -Uri $url `
            -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 30
        $recoveryStatus = [int]$response.StatusCode
    } catch {
        $recoveryStatus = if ($_.Exception.Response) {
            [int]$_.Exception.Response.StatusCode
        } else {
            0
        }
    }
    Assert-True ($recoveryStatus -eq 401) "the account limit should recover after the configured Redis window; received $recoveryStatus"
    Write-Host "[login-rate-limit-smoke] recovery status=401"
}

Write-Host "[login-rate-limit-smoke] PASS first429=$($rateLimited[0].Attempt)" -ForegroundColor Green
