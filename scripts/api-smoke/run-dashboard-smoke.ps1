param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password"
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) {
        throw "Dashboard smoke assertion failed: $Message"
    }
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{}
    )

    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        TimeoutSec = 30
        Headers = $Headers
    }
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 20
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }

    try {
        $response = Invoke-RestMethod @params
    } catch {
        $statusCode = $null
        $responseBody = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($null -ne $stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseBody = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            } catch {
                $responseBody = "<failed to read response body: $($_.Exception.Message)>"
            }
        }
        throw "HTTP failed: $Method $Path status=$statusCode response=$responseBody"
    }

    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }
    return $response
}

Write-Host "[dashboard-smoke] BaseUrl=$BaseUrl"

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$headers = @{ Authorization = "Bearer $($teacherLogin.token)" }

$dashboard = (Invoke-MindMarkApi GET "/api/v1/teacher/dashboard" $null $headers).data
Assert-True ($null -ne $dashboard.metrics) "metrics array exists"
Assert-True ($null -ne $dashboard.tasks) "tasks array exists"
Assert-True (($dashboard.metrics | Measure-Object).Count -eq 4) "dashboard has 4 metric cards"
foreach ($metric in $dashboard.metrics) {
    Assert-True (-not [string]::IsNullOrWhiteSpace($metric.label)) "metric label exists"
    Assert-True ($null -ne $metric.value) "metric value exists"
    Assert-True (-not [string]::IsNullOrWhiteSpace($metric.hint)) "metric hint exists"
}
foreach ($task in $dashboard.tasks) {
    Assert-True (-not [string]::IsNullOrWhiteSpace($task.name)) "task name exists"
    Assert-True (-not [string]::IsNullOrWhiteSpace($task.status)) "task status exists"
    Assert-True (-not [string]::IsNullOrWhiteSpace($task.to)) "task target exists"
}

Write-Host "MindMark dashboard aggregate smoke passed." -ForegroundColor Green
[ordered]@{
    metricCount = ($dashboard.metrics | Measure-Object).Count
    taskCount = ($dashboard.tasks | Measure-Object).Count
    metrics = ($dashboard.metrics | ForEach-Object { $_.label })
} | ConvertTo-Json -Depth 8