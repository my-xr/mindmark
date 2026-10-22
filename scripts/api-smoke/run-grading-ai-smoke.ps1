param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $PaperId = "paper-001",
    [int] $AiJobTimeoutSec = 90,
    [string] $AiProvider = $env:MINDMARK_SMOKE_AI_PROVIDER,
    [string] $AiProviderBaseUrl = $env:MINDMARK_SMOKE_AI_BASE_URL,
    [string] $AiProviderModel = $env:MINDMARK_SMOKE_AI_MODEL,
    [string] $AiProviderApiKeyEnvName = "MINDMARK_SMOKE_AI_API_KEY",
    [switch] $RequireAiSucceeded
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) {
        throw "Grading AI smoke assertion failed: $Message"
    }
}

function Convert-ToIsoOffset([DateTimeOffset] $Value) {
    return $Value.ToString("yyyy-MM-ddTHH:mm:sszzz")
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 45
    )

    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        TimeoutSec = $TimeoutSec
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
        $requestBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 30 -Compress } else { "<empty>" }
        throw "HTTP failed: $Method $Path status=$statusCode request=$requestBody response=$responseBody"
    }

    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }
    return $response
}

function Invoke-MindMarkApiExpectConflict {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body,
        [hashtable] $Headers
    )

    try {
        [void](Invoke-MindMarkApi $Method $Path $Body $Headers)
    } catch {
        if ($_.Exception.Message -match "409" -or $_.Exception.Message -match "MM-409") {
            return $true
        }
        throw
    }
    return $false
}

function Wait-GradingAiJob {
    param(
        [string] $TaskId,
        [hashtable] $Headers
    )

    $deadline = [DateTimeOffset]::Now.AddSeconds($AiJobTimeoutSec)
    $latest = $null
    do {
        Start-Sleep -Seconds 2
        $latest = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$TaskId/ai-grading-job/latest" $null $Headers).data
        if ($null -ne $latest -and @("SUCCEEDED", "SKIPPED", "FAILED") -contains $latest.status) {
            return $latest
        }
    } while ([DateTimeOffset]::Now -lt $deadline)

    if ($null -eq $latest) {
        throw "AI grading job was not created for task $TaskId"
    }
    throw "AI grading job did not finish in ${AiJobTimeoutSec}s: status=$($latest.status) id=$($latest.id)"
}

function Get-StudentAnswerForQuestion {
    param(
        [object] $TeacherPaper,
        [object] $StudentPaper,
        [string] $QuestionId
    )

    $teacherPaperQuestion = @(
        @($TeacherPaper.questions) |
            Where-Object { $_.questionId -eq $QuestionId } |
            Select-Object -First 1
    )
    $studentPaperQuestion = @(
        @($StudentPaper.questions) |
            Where-Object { $_.questionId -eq $QuestionId } |
            Select-Object -First 1
    )
    Assert-True ($teacherPaperQuestion.Count -eq 1) "teacher paper contains question $QuestionId"
    Assert-True ($studentPaperQuestion.Count -eq 1) "student paper contains question $QuestionId"

    $teacherQuestion = $teacherPaperQuestion[0].question
    if ($teacherQuestion.type -ne "SINGLE_CHOICE" -and $teacherQuestion.type -ne "MULTIPLE_CHOICE") {
        return $teacherQuestion.answer
    }

    $displayKeys = @()
    foreach ($canonicalKey in @($teacherQuestion.answer)) {
        $canonicalOption = @(
            @($teacherQuestion.options) |
                Where-Object { $_.key -eq [string]$canonicalKey } |
                Select-Object -First 1
        )
        Assert-True ($canonicalOption.Count -eq 1) "canonical option exists for $QuestionId/$canonicalKey"
        $studentOption = @(
            @($studentPaperQuestion[0].question.options) |
                Where-Object { $_.content -eq $canonicalOption[0].content } |
                Select-Object -First 1
        )
        Assert-True ($studentOption.Count -eq 1) "student option exists for $QuestionId/$canonicalKey"
        $displayKeys += [string]$studentOption[0].key
    }

    if ($teacherQuestion.type -eq "MULTIPLE_CHOICE") {
        return @($displayKeys)
    }
    return $displayKeys[0]
}

$runId = Get-Date -Format "yyyyMMddHHmmss"
$summary = [ordered]@{}
Write-Host "[grading-ai-smoke] BaseUrl=$BaseUrl runId=$runId"

$summary.actuator = (Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get -TimeoutSec 30).status
$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.token)" }

$aiApiKey = if ([string]::IsNullOrWhiteSpace($AiProviderApiKeyEnvName)) { $null } else { [Environment]::GetEnvironmentVariable($AiProviderApiKeyEnvName) }
if (-not [string]::IsNullOrWhiteSpace($aiApiKey)) {
    $effectiveAiProvider = if ([string]::IsNullOrWhiteSpace($AiProvider)) { "OPENAI" } else { $AiProvider }
    $effectiveAiBaseUrl = if ([string]::IsNullOrWhiteSpace($AiProviderBaseUrl)) { "https://api.openai.com/v1" } else { $AiProviderBaseUrl }
    $effectiveAiModel = if ([string]::IsNullOrWhiteSpace($AiProviderModel)) { "gpt-4.1-mini" } else { $AiProviderModel }
    $savedProvider = (Invoke-MindMarkApi PUT "/api/v1/ai/provider-settings" @{
        provider = $effectiveAiProvider
        baseUrl = $effectiveAiBaseUrl
        model = $effectiveAiModel
        apiKey = $aiApiKey
    } $teacherHeaders).data
    $providerTest = (Invoke-MindMarkApi POST "/api/v1/ai/provider-settings/test" @{
        provider = $effectiveAiProvider
        baseUrl = $effectiveAiBaseUrl
        model = $effectiveAiModel
    } $teacherHeaders 60).data
    $summary.aiProviderConfigured = $true
    $summary.aiProviderTestOk = [bool]$providerTest.success
    $summary.aiProvider = $savedProvider.provider
    $summary.aiProviderModel = $savedProvider.model
    $summary.aiProviderBaseUrl = $savedProvider.baseUrl
    $summary.aiProviderTestMessage = $providerTest.message
    if ($RequireAiSucceeded -and -not [bool]$providerTest.success) {
        throw "AI provider connection test failed before grading job: $($providerTest.message)"
    }
} else {
    $summary.aiProviderConfigured = $false
    $summary.aiProviderApiKeyEnvName = $AiProviderApiKeyEnvName
}

$course = (Invoke-MindMarkApi POST "/api/v1/admin/courses" @{
    code = "GRD-$runId"
    name = "Grading Smoke Course $runId"
    description = "Generated by run-grading-ai-smoke.ps1"
    status = "ACTIVE"
} $teacherHeaders).data
$class = (Invoke-MindMarkApi POST "/api/v1/admin/classes" @{
    courseId = $course.id
    code = "GRD-CLS-$runId"
    name = "Grading Smoke Class $runId"
    grade = "2026"
    major = "Software Engineering"
    status = "ACTIVE"
} $teacherHeaders).data
$summary.classId = $class.id

$studentNo = "202698$($runId.Substring(6))"
$initialPassword = $studentNo.Substring($studentNo.Length - 6)
$newPassword = "GradingSmoke$runId"
$import = (Invoke-MindMarkApi POST "/api/v1/classes/$($class.id)/students/import" @{
    className = $class.name
    students = @(
        @{
            studentNo = $studentNo
            name = "Grading Smoke Student $runId"
            email = "$studentNo@student.mindmark.local"
            className = $class.name
            grade = "2026"
            major = "Software Engineering"
        }
    )
} $teacherHeaders).data
Assert-True ($import.createdCount -eq 1) "student import creates one account"

$studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $studentNo
    password = $initialPassword
}).data
$studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
if ($studentLogin.mustChangePassword -eq $true) {
    [void](Invoke-MindMarkApi POST "/api/v1/auth/change-password" @{
        oldPassword = $initialPassword
        newPassword = $newPassword
    } $studentHeaders)
    $studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
        username = $studentNo
        password = $newPassword
    }).data
    $studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
}

$paper = (Invoke-MindMarkApi GET "/api/v1/papers/$PaperId" $null $teacherHeaders).data
if ($paper.status -ne "READY" -and $paper.status -ne "PUBLISHED") {
    [void](Invoke-MindMarkApi PATCH "/api/v1/papers/$PaperId/status" @{ status = "READY" } $teacherHeaders)
}

$now = [DateTimeOffset]::Now
$exam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Grading AI Audit Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($now.AddMinutes(-1))
    endAt = Convert-ToIsoOffset($now.AddMinutes(8))
    durationMinutes = 8
} $teacherHeaders).data
Assert-True ($exam.status -eq "ONGOING") "exam is ongoing"
$summary.examId = $exam.id

$studentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $exam.id } | Select-Object -First 1)
Assert-True ($null -ne $studentExam) "exam appears in student list"
$answerSheetId = $studentExam.answerSheetId
$studentPaper = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($exam.id)/paper" $null $studentHeaders).data
$studentSingleChoiceAnswer = Get-StudentAnswerForQuestion $paper $studentPaper "Q-1001"
$studentTrueFalseAnswer = Get-StudentAnswerForQuestion $paper $studentPaper "Q-1003"
$studentSubjectiveAnswer = Get-StudentAnswerForQuestion $paper $studentPaper "Q-1005"

[void](Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$answerSheetId/draft" @{
    answers = @(
        @{ questionId = "Q-1001"; answer = $studentSingleChoiceAnswer },
        @{ questionId = "Q-1003"; answer = $studentTrueFalseAnswer },
        @{ questionId = "Q-1005"; answer = $studentSubjectiveAnswer }
    )
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders)
[void](Invoke-MindMarkApi POST "/api/v1/answer-sheets/$answerSheetId/submit" $null $studentHeaders)

$taskId = "GT-$answerSheetId"
$autoGraded = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/auto-grade" $null $teacherHeaders).data
Assert-True ($autoGraded.status -eq "AI_CHECKED" -or $autoGraded.status -eq "REVIEWED") "auto grade updates task status"
$summary.gradingTaskId = $taskId
$summary.autoGradeStatus = $autoGraded.status

$initialItems = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$taskId/items?page=1&pageSize=10" $null $teacherHeaders).data
Assert-True ($initialItems.total -ge 1) "grading items page has rows"
$subjectiveItem = ($initialItems.items | Where-Object { $_.objective -eq $false } | Select-Object -First 1)
Assert-True ($null -ne $subjectiveItem) "subjective grading item exists"
Assert-True (-not [string]::IsNullOrWhiteSpace($subjectiveItem.gradingSource)) "grading source is persisted on item"
Assert-True (-not [string]::IsNullOrWhiteSpace($subjectiveItem.aiRubricVersion)) "rubric version is persisted on item"
Assert-True ($null -ne $subjectiveItem.aiRawScore) "raw score is persisted on item"

$job = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/ai-grading-job" $null $teacherHeaders).data
Assert-True (-not [string]::IsNullOrWhiteSpace($job.id)) "AI grading job id exists"
Assert-True (-not [string]::IsNullOrWhiteSpace($job.promptVersion)) "AI grading prompt version exists"
Assert-True (-not [string]::IsNullOrWhiteSpace($job.requestId)) "AI grading request id exists"
$finalJob = Wait-GradingAiJob $taskId $teacherHeaders
Assert-True (@("SUCCEEDED", "SKIPPED", "FAILED") -contains $finalJob.status) "AI grading job reaches terminal status"
if ($RequireAiSucceeded) {
    Assert-True ($finalJob.status -eq "SUCCEEDED") "AI grading job must succeed when -RequireAiSucceeded is used"
}
Assert-True (-not [string]::IsNullOrWhiteSpace($finalJob.promptVersion)) "final AI job keeps prompt version"
Assert-True (-not [string]::IsNullOrWhiteSpace($finalJob.requestId)) "final AI job keeps request id"
Assert-True ($null -ne $finalJob.resultSummary -or $null -ne $finalJob.errorMessage) "final AI job has summary or error"
$summary.aiJobStatus = $finalJob.status
$summary.aiJobDurationMs = $finalJob.durationMs
$summary.aiJobSummary = $finalJob.resultSummary

$itemsAfterAi = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$taskId/items?page=1&pageSize=10" $null $teacherHeaders).data
$reviewTarget = ($itemsAfterAi.items | Where-Object { $_.objective -eq $false } | Select-Object -First 1)
Assert-True ($null -ne $reviewTarget) "review target exists"
$reviewScore = [decimal]$reviewTarget.maxScore
if ($reviewScore -gt 0) { $reviewScore = [Math]::Max(0, $reviewScore - 1) }
[void](Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/items/$($reviewTarget.questionId)/review" @{
    finalScore = $reviewScore
    comment = "Smoke teacher override after AI audit."
} $teacherHeaders)
$itemsAfterReview = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$taskId/items?page=1&pageSize=10" $null $teacherHeaders).data
$reviewedItem = ($itemsAfterReview.items | Where-Object { $_.questionId -eq $reviewTarget.questionId } | Select-Object -First 1)
Assert-True ($reviewedItem.gradingSource -eq "TEACHER_REVIEW") "teacher review source is persisted"
Assert-True (-not [string]::IsNullOrWhiteSpace($reviewedItem.teacherOverrideReason)) "teacher override reason is persisted"
Assert-True ($null -ne $reviewedItem.scoreDiff) "score diff is persisted"
$summary.teacherOverrideQuestionId = $reviewedItem.questionId
$summary.teacherOverrideScoreDiff = $reviewedItem.scoreDiff

# Use a second failed answer sheet to verify the fail-safe confirmation policy.
$failedNow = [DateTimeOffset]::Now
$failedExam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Grading Failed Confirm Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($failedNow.AddMinutes(-1))
    endAt = Convert-ToIsoOffset($failedNow.AddMinutes(8))
    durationMinutes = 8
} $teacherHeaders).data
$failedStudentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $failedExam.id } | Select-Object -First 1)
$failedSheetId = $failedStudentExam.answerSheetId
$failedStudentPaper = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($failedExam.id)/paper" $null $studentHeaders).data
$failedStudentSingleChoiceAnswer = Get-StudentAnswerForQuestion $paper $failedStudentPaper "Q-1001"
$failedStudentTrueFalseAnswer = Get-StudentAnswerForQuestion $paper $failedStudentPaper "Q-1003"
[void](Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$failedSheetId/draft" @{
    answers = @(
        @{ questionId = "Q-1001"; answer = $failedStudentSingleChoiceAnswer },
        @{ questionId = "Q-1003"; answer = $failedStudentTrueFalseAnswer },
        @{ questionId = "Q-1005"; answer = "" }
    )
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders)
[void](Invoke-MindMarkApi POST "/api/v1/answer-sheets/$failedSheetId/submit" $null $studentHeaders)
$failedTaskId = "GT-$failedSheetId"
[void](Invoke-MindMarkApi POST "/api/v1/grading-tasks/$failedTaskId/auto-grade" $null $teacherHeaders)
$blocked = Invoke-MindMarkApiExpectConflict POST "/api/v1/grading-tasks/$failedTaskId/confirm-system-score" $null $teacherHeaders
Assert-True $blocked "failed task cannot be confirmed without includeFailed"
$confirmedFailed = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$failedTaskId/confirm-system-score?includeFailed=true" $null $teacherHeaders).data
Assert-True ($confirmedFailed.status -eq "REVIEWED") "failed task can be confirmed with includeFailed=true"
$summary.failedConfirmGuardChecked = $true

Write-Host "MindMark grading center AI audit smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 30

