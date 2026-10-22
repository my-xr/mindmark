from pathlib import Path
p = Path('scripts/api-smoke/run-pagination-contract-smoke.ps1')
text = r'''param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password"
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) {
        throw "Pagination smoke assertion failed: $Message"
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
        $params.ContentType = "application/json"
        $params.Body = $Body | ConvertTo-Json -Depth 30
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

function Assert-PageResponse([object] $Page, [int] $ExpectedPageSize, [string] $Name) {
    Assert-True ($null -ne $Page.items) "$Name has items array"
    Assert-True ($Page.total -ge 0) "$Name total is non-negative"
    Assert-True ($Page.page -ge 1) "$Name page is one-based"
    Assert-True ($Page.pageSize -eq $ExpectedPageSize) "$Name pageSize is normalized"
    Assert-True ($Page.totalPages -ge 1) "$Name totalPages is present"
    Assert-True ($Page.page -le $Page.totalPages) "$Name page is not beyond totalPages"
    Assert-True (($Page.items | Measure-Object).Count -le $ExpectedPageSize) "$Name item count does not exceed pageSize"
    Assert-True ($null -ne $Page.hasPrevious) "$Name hasPrevious is present"
    Assert-True ($null -ne $Page.hasNext) "$Name hasNext is present"
}

Write-Host "[pagination-smoke] BaseUrl=$BaseUrl"

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$headers = @{ Authorization = "Bearer $($teacherLogin.token)" }

$summary = [ordered]@{}

$gradingPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $gradingPage 2 "grading tasks page"
$summary.gradingTaskTotal = $gradingPage.total

$gradingLastPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?page=999&pageSize=2" $null $headers).data
Assert-PageResponse $gradingLastPage 2 "grading tasks overflow page"

if (($gradingPage.items | Measure-Object).Count -gt 0) {
    $task = $gradingPage.items | Select-Object -First 1
    $itemPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$($task.id)/items?page=1&pageSize=2" $null $headers).data
    Assert-PageResponse $itemPage 2 "grading task items page"
    $summary.gradingItemTotal = $itemPage.total
}
else {
    $summary.gradingItemTotal = "SKIPPED_NO_TASK"
}

$scoreBatchPage = (Invoke-MindMarkApi GET "/api/v1/score-summaries?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $scoreBatchPage 2 "score summaries page"
$summary.scoreSummaryTotal = $scoreBatchPage.total

if (($scoreBatchPage.items | Measure-Object).Count -gt 0) {
    $summaryItem = $scoreBatchPage.items | Select-Object -First 1
    $scoreReportPage = (Invoke-MindMarkApi GET "/api/v1/exams/$($summaryItem.examId)/score-reports?page=1&pageSize=2" $null $headers).data
    Assert-PageResponse $scoreReportPage 2 "score reports page"
    $summary.scoreReportTotal = $scoreReportPage.total
}
else {
    $summary.scoreReportTotal = "SKIPPED_NO_SCORE_SUMMARY"
}

Write-Host "MindMark pagination contract smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 20
'''
p.write_text(text, encoding='utf-8')
