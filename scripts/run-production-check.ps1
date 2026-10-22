param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$SkipHealth
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Require-Env([string]$Name) {
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Missing required production environment variable: $Name"
    }
    return $value.Trim()
}

function Assert-NotLocal([string]$Name, [string]$Value) {
    $normalized = $Value.ToLowerInvariant()
    if ($normalized.Contains("localhost") -or $normalized.Contains("127.0.0.1") -or $normalized.Contains("[::1]")) {
        throw "$Name must not point to localhost in a production check"
    }
}

function Invoke-Step([string]$Name, [scriptblock]$Action) {
    Write-Host "[production-check] START $Name" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        throw "$Name exited with code $LASTEXITCODE"
    }
    Write-Host "[production-check] PASS $Name" -ForegroundColor Green
}

if ($env:SPRING_PROFILES_ACTIVE -notmatch "(^|,)prod(,|$)") {
    throw "SPRING_PROFILES_ACTIVE must include prod"
}

$databaseHost = Require-Env "MINDMARK_DB_HOST"
$databaseName = Require-Env "MINDMARK_DB_NAME"
$databaseUser = Require-Env "MINDMARK_DB_USERNAME"
$databasePassword = Require-Env "MINDMARK_DB_PASSWORD"
$redisHost = Require-Env "MINDMARK_REDIS_HOST"
$redisPassword = Require-Env "MINDMARK_REDIS_PASSWORD"
$aiKeySecret = Require-Env "MINDMARK_AI_KEY_SECRET"
$minioEndpoint = Require-Env "MINDMARK_MINIO_ENDPOINT"
$minioAccessKey = Require-Env "MINDMARK_MINIO_ACCESS_KEY"
$minioSecretKey = Require-Env "MINDMARK_MINIO_SECRET_KEY"
$minioBucket = Require-Env "MINDMARK_MINIO_BUCKET"

Assert-NotLocal "MINDMARK_DB_HOST" $databaseHost
Assert-NotLocal "MINDMARK_REDIS_HOST" $redisHost
Assert-NotLocal "MINDMARK_MINIO_ENDPOINT" $minioEndpoint
if ($databaseName -ieq "postgres" -or $databaseUser -ieq "postgres" -or $databasePassword -eq "123456") {
    throw "local PostgreSQL defaults are not allowed in production"
}
if ($redisPassword.Length -lt 1) {
    throw "MINDMARK_REDIS_PASSWORD must not be empty in production"
}
if ($aiKeySecret.Length -lt 32 -or $aiKeySecret -eq "mindmark-local-ai-key-secret") {
    throw "MINDMARK_AI_KEY_SECRET must be at least 32 characters and non-default"
}
if ($minioAccessKey -eq "minioadmin" -or $minioSecretKey -eq "minioadmin123") {
    throw "local MinIO credentials are not allowed in production"
}
if ($env:MINDMARK_OPENAPI_ENABLED -eq "true") {
    throw "MINDMARK_OPENAPI_ENABLED must remain false in production"
}

Write-Host "[production-check] environment contract passed (secret values omitted)" -ForegroundColor Green

if (-not $SkipBuild) {
    Invoke-Step "backend compile" {
        mvn -f apps/mindmark-server/pom.xml -q -DskipTests compile
    }
}
if (-not $SkipTests) {
    Invoke-Step "backend tests" {
        mvn -f apps/mindmark-server/pom.xml -q test
    }
}
if (-not $SkipHealth) {
    Invoke-Step "health endpoint" {
        $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/v1/system/health" -TimeoutSec 10
        if ($health.code -and $health.code -ne "0") {
            throw "health endpoint returned code $($health.code)"
        }
        if ($health.data.status -ne "UP") {
            throw "health endpoint is not UP"
        }
        Write-Host "[production-check] health=$($health.data.status)"
    }
}

Write-Host "[production-check] PASS" -ForegroundColor Green
