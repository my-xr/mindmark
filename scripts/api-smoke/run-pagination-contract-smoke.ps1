param(
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
        $jsonBody = $Body | ConvertTo-Json -Depth 30
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

function Get-ItemCount([object] $Items) {
    return ($Items | Measure-Object).Count
}

function Get-ItemIdSignature([object] $Items) {
    return (($Items | ForEach-Object {
        if ($_.PSObject.Properties.Name -contains "id") { $_.id }
        elseif ($_.PSObject.Properties.Name -contains "examId") { $_.examId }
        elseif ($_.PSObject.Properties.Name -contains "questionId") { $_.questionId }
        else { $_ | ConvertTo-Json -Compress -Depth 10 }
    }) -join ",")
}

function Assert-PageResponse([object] $Page, [int] $ExpectedPageSize, [string] $Name) {
    Assert-True ($null -ne $Page.items) "$Name has items array"
    Assert-True ($Page.total -ge 0) "$Name total is non-negative"
    Assert-True ($Page.page -ge 1) "$Name page is one-based"
    Assert-True ($Page.pageSize -eq $ExpectedPageSize) "$Name pageSize is normalized"
    Assert-True ($Page.totalPages -ge 1) "$Name totalPages is present"
    Assert-True ($Page.page -le $Page.totalPages) "$Name page is not beyond totalPages"
    Assert-True ((Get-ItemCount $Page.items) -le $ExpectedPageSize) "$Name item count does not exceed pageSize"
    Assert-True ($null -ne $Page.hasPrevious) "$Name hasPrevious is present"
    Assert-True ($null -ne $Page.hasNext) "$Name hasNext is present"
}

function Assert-SecondPageWindow([string] $Path, [object] $FirstPage, [string] $Name) {
    if ($FirstPage.total -le $FirstPage.pageSize) {
        return
    }

    $secondPage = (Invoke-MindMarkApi GET $Path $null $headers).data
    Assert-PageResponse $secondPage $FirstPage.pageSize "$Name second page"
    Assert-True ((Get-ItemIdSignature $FirstPage.items) -ne (Get-ItemIdSignature $secondPage.items)) "$Name first and second page windows differ"
}

function Assert-Ascending([object] $Items, [string] $PropertyName, [string] $Name) {
    $previous = $null
    foreach ($item in $Items) {
        $current = $item.$PropertyName
        if ($null -ne $previous) {
            Assert-True ($previous -le $current) "$Name is sorted ascending by $PropertyName"
        }
        $previous = $current
    }
}

function Assert-DescendingDate([object] $Items, [string] $PropertyName, [string] $Name) {
    $previous = $null
    foreach ($item in $Items) {
        $current = [datetimeoffset]$item.$PropertyName
        if ($null -ne $previous) {
            Assert-True ($previous -ge $current) "$Name is sorted descending by $PropertyName"
        }
        $previous = $current
    }
}

Write-Host "[pagination-smoke] BaseUrl=$BaseUrl"

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$headers = @{ Authorization = "Bearer $($teacherLogin.token)" }

$summary = [ordered]@{}

$questionPage = (Invoke-MindMarkApi GET "/api/v1/questions?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $questionPage 2 "question bank page"
Assert-SecondPageWindow "/api/v1/questions?page=2&pageSize=2" $questionPage "question bank"
$summary.questionBankTotal = $questionPage.total

$aiReviewPage = (Invoke-MindMarkApi GET "/api/v1/questions?source=AI&status=PENDING_REVIEW&page=1&pageSize=2" $null $headers).data
Assert-PageResponse $aiReviewPage 2 "AI review question page"
$summary.aiReviewTotal = $aiReviewPage.total

$aiTaskPage = (Invoke-MindMarkApi GET "/api/v1/ai/questions/generation-tasks?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $aiTaskPage 2 "AI generation task page"
$summary.aiTaskTotal = $aiTaskPage.total

$paperPage = (Invoke-MindMarkApi GET "/api/v1/papers?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $paperPage 2 "papers page"
$summary.paperTotal = $paperPage.total
if ((Get-ItemCount $paperPage.items) -gt 0) {
    $paperItem = $paperPage.items | Select-Object -First 1
    $paperQuestionPage = (Invoke-MindMarkApi GET "/api/v1/papers/$($paperItem.id)/questions?page=1&pageSize=2" $null $headers).data
    Assert-PageResponse $paperQuestionPage 2 "paper questions page"
    Assert-Ascending $paperQuestionPage.items "order" "paper questions page"

    $paperQuestionAllPage = (Invoke-MindMarkApi GET "/api/v1/papers/$($paperItem.id)/questions?page=1&pageSize=100" $null $headers).data
    $selectedQuestionIds = @($paperQuestionAllPage.items | ForEach-Object { $_.questionId })
    $availableQuestionPage = (Invoke-MindMarkApi GET "/api/v1/questions?status=ACTIVE&excludePaperId=$($paperItem.id)&page=1&pageSize=20" $null $headers).data
    Assert-PageResponse $availableQuestionPage 20 "available question excludePaperId page"
    foreach ($availableQuestion in $availableQuestionPage.items) {
        Assert-True (-not ($selectedQuestionIds -contains $availableQuestion.id)) "excludePaperId removes selected paper questions from available pool"
    }

    $summary.paperQuestionTotal = $paperQuestionPage.total
    $summary.availableQuestionTotal = $availableQuestionPage.total
}
else {
    $summary.paperQuestionTotal = "SKIPPED_NO_PAPER"
    $summary.availableQuestionTotal = "SKIPPED_NO_PAPER"
}

$examPage = (Invoke-MindMarkApi GET "/api/v1/exams?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $examPage 2 "exams page"
$summary.examTotal = $examPage.total
if ((Get-ItemCount $examPage.items) -gt 0) {
    $examItem = $examPage.items | Select-Object -First 1
    $securityEventPage = (Invoke-MindMarkApi GET "/api/v1/exams/$($examItem.id)/security-events?page=1&pageSize=2" $null $headers).data
    Assert-PageResponse $securityEventPage 2 "security events page"
    Assert-DescendingDate $securityEventPage.items "serverReceivedAt" "security events page"
    $summary.securityEventTotal = $securityEventPage.total
}
else {
    $summary.securityEventTotal = "SKIPPED_NO_EXAM"
}

$reviewPage = (Invoke-MindMarkApi GET "/api/v1/exams/reviews?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $reviewPage 2 "review reports page"
Assert-SecondPageWindow "/api/v1/exams/reviews?page=2&pageSize=2" $reviewPage "review reports"
$summary.reviewReportTotal = $reviewPage.total

$gradingPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?page=1&pageSize=2" $null $headers).data
Assert-PageResponse $gradingPage 2 "grading tasks page"
Assert-SecondPageWindow "/api/v1/grading-tasks?page=2&pageSize=2" $gradingPage "grading tasks"
$summary.gradingTaskTotal = $gradingPage.total

$gradingLastPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?page=999&pageSize=2" $null $headers).data
Assert-PageResponse $gradingLastPage 2 "grading tasks overflow page"

if ((Get-ItemCount $gradingPage.items) -gt 0) {
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

if ((Get-ItemCount $scoreBatchPage.items) -gt 0) {
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
