from pathlib import Path
script = r'''param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $CourseId = "course-frontend-001",
    [ValidateSet("OPENAI", "ANTHROPIC")]
    [string] $Provider = "OPENAI",
    [int] $Count = 2,
    [int] $TimeoutSeconds = 240
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw "Smoke assertion failed: $Message" }
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 30
    )

    Add-Type -AssemblyName System.Net.Http
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), "$BaseUrl$Path")
    foreach ($key in $Headers.Keys) { $request.Headers.TryAddWithoutValidation($key, [string] $Headers[$key]) | Out-Null }
    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 30
        $request.Content = New-Object System.Net.Http.StringContent($json, [System.Text.Encoding]::UTF8, "application/json")
    }

    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
        throw "HTTP $([int]$response.StatusCode) $($response.ReasonPhrase): $content"
    }
    if ([string]::IsNullOrWhiteSpace($content)) { return $null }
    return $content | ConvertFrom-Json
}

function Has-Chinese([string] $Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
    return [regex]::IsMatch($Value, "\p{IsCJKUnifiedIdeographs}")
}

$summary = [ordered]@{}
$runId = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "[ai-question-loop-smoke] BaseUrl=$BaseUrl provider=$Provider runId=$runId"

$health = (Invoke-MindMarkApi GET "/api/v1/system/health").data
Assert-True ($health.status -eq "UP") "api health is UP"
$summary.apiHealth = $health.status

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$headers = @{ Authorization = "Bearer $($teacherLogin.token)" }
$summary.teacherLogin = $true

$providerSetting = (Invoke-MindMarkApi GET "/api/v1/ai/provider-settings?provider=$Provider" $null $headers).data
Assert-True ($providerSetting.configured -eq $true) "AI provider $Provider must be configured in personal settings"
Assert-True (-not [string]::IsNullOrWhiteSpace($providerSetting.baseUrl)) "provider baseUrl exists"
Assert-True (-not [string]::IsNullOrWhiteSpace($providerSetting.model)) "provider model exists"
$summary.provider = $Provider
$summary.providerBaseUrl = $providerSetting.baseUrl
$summary.providerModel = $providerSetting.model

$taskRequest = @{
    courseId = $CourseId
    provider = $Provider
    prompt = "企业级 AI 出题闭环 Smoke $runId"
    questionType = "SINGLE_CHOICE"
    difficulty = "MEDIUM"
    count = $Count
    knowledgePoint = "Vue 组件通信"
    requirement = "必须生成中文题干、中文选项、中文解析；题干清晰，选项区分度高。"
}

$task = (Invoke-MindMarkApi POST "/api/v1/ai/questions/generation-tasks" $taskRequest $headers 20).data
Assert-True (-not [string]::IsNullOrWhiteSpace($task.id)) "generation task id exists"
$summary.taskId = $task.id
Write-Host "[ai-question-loop-smoke] task submitted: $($task.id)"

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    Start-Sleep -Seconds 2
    $task = (Invoke-MindMarkApi GET "/api/v1/ai/questions/generation-tasks/$($task.id)" $null $headers 20).data
    Write-Host "[ai-question-loop-smoke] task status=$($task.status) generated=$($task.generatedCount)"
    if ($task.status -eq "FAILED") { throw "AI generation task failed: $($task.errorMessage)" }
} while (($task.status -eq "PENDING" -or $task.status -eq "RUNNING") -and (Get-Date) -lt $deadline)

Assert-True ($task.status -eq "SUCCEEDED") "AI generation task succeeds before timeout"
Assert-True ([int]$task.generatedCount -eq $Count) "generatedCount equals requested Count"
Assert-True ($task.generatedQuestionIds.Count -eq $Count) "generated question ids count equals requested Count"
$summary.generatedCount = $task.generatedCount
$summary.generatedQuestionIds = $task.generatedQuestionIds

$page = (Invoke-MindMarkApi GET "/api/v1/questions?source=AI&status=PENDING_REVIEW&courseId=$CourseId&page=1&pageSize=100" $null $headers).data
$generatedQuestions = @()
foreach ($qid in $task.generatedQuestionIds) {
    $question = $page.items | Where-Object { $_.id -eq $qid } | Select-Object -First 1
    if ($null -eq $question) {
        $question = (Invoke-MindMarkApi GET "/api/v1/questions/$qid" $null $headers).data
    }
    Assert-True ($null -ne $question) "generated question $qid can be queried"
    Assert-True ($question.status -eq "PENDING_REVIEW") "generated question $qid is pending review"
    Assert-True ($question.source -eq "AI") "generated question $qid source=AI"
    Assert-True (Has-Chinese $question.title) "generated question $qid title contains Chinese"
    Assert-True (Has-Chinese $question.analysis) "generated question $qid analysis contains Chinese"
    $generatedQuestions += $question
}
Write-Host "[ai-question-loop-smoke] generated questions queried and Chinese content checked"

$accepted = (Invoke-MindMarkApi POST "/api/v1/questions/$($generatedQuestions[0].id)/review" @{
    action = "ACCEPTED"
    comment = "Smoke 审核通过"
} $headers).data
Assert-True ($accepted.status -eq "ACTIVE") "accepted AI question becomes ACTIVE"
$summary.acceptedQuestionId = $accepted.id

$rejected = (Invoke-MindMarkApi POST "/api/v1/questions/$($generatedQuestions[1].id)/review" @{
    action = "REJECTED"
    comment = "Smoke 驳回后编辑再审核"
} $headers).data
Assert-True ($rejected.status -eq "REJECTED") "rejected AI question becomes REJECTED"
$summary.rejectedQuestionId = $rejected.id

$editBody = @{
    courseId = $rejected.courseId
    title = "$($rejected.title) - 教师修订"
    type = $rejected.type
    difficulty = $rejected.difficulty
    knowledgePoints = $rejected.knowledgePoints
    score = $rejected.score
    answer = $rejected.answer
    analysis = "$($rejected.analysis)`nSmoke：教师二次编辑后重新提交审核。"
    options = $rejected.options
    scoringPoints = $rejected.scoringPoints
}
$edited = (Invoke-MindMarkApi PUT "/api/v1/questions/$($rejected.id)" $editBody $headers).data
Assert-True ($edited.status -eq "PENDING_REVIEW") "edited rejected AI question returns to PENDING_REVIEW"
Assert-True ($edited.title.EndsWith("教师修订")) "edited rejected AI question persists edited title"
$summary.editedRejectedBackToPending = $true

$editedAccepted = (Invoke-MindMarkApi POST "/api/v1/questions/$($edited.id)/review" @{
    action = "EDITED_ACCEPTED"
    comment = "Smoke 修订后通过"
} $headers).data
Assert-True ($editedAccepted.status -eq "ACTIVE") "edited accepted AI question becomes ACTIVE"
Assert-True ($editedAccepted.reviewAction -eq "EDITED_ACCEPTED") "review action is EDITED_ACCEPTED"
$summary.editedAcceptedQuestionId = $editedAccepted.id

foreach ($qid in @($accepted.id, $editedAccepted.id)) {
    try {
        $deleteResult = (Invoke-MindMarkApi DELETE "/api/v1/questions/$qid" $null $headers).data
        Write-Host "[ai-question-loop-smoke] cleanup $qid physicallyDeleted=$($deleteResult.physicallyDeleted)"
    } catch {
        Write-Host "[ai-question-loop-smoke] cleanup skipped for $qid: $($_.Exception.Message)"
    }
}

Write-Host "MindMark AI question generation + review loop smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 40
'''
Path('scripts/api-smoke/run-ai-question-loop-smoke.ps1').write_text(script, encoding='utf-8')
