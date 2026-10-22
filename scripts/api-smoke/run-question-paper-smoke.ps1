param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $PaperId = "paper-001"
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
        [hashtable] $Headers = @{}
    )

    Add-Type -AssemblyName System.Net.Http
    $client = New-Object System.Net.Http.HttpClient
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), [Uri]"$BaseUrl$Path")
    foreach ($key in $Headers.Keys) {
        [void]$request.Headers.TryAddWithoutValidation($key, [string]$Headers[$key])
    }
    $requestBody = "<empty>"
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 40
        $requestBody = $Body | ConvertTo-Json -Depth 40 -Compress
        $request.Content = New-Object System.Net.Http.StringContent($jsonBody, [System.Text.Encoding]::UTF8, "application/json")
    }

    try {
        $responseMessage = $client.SendAsync($request).GetAwaiter().GetResult()
        $responseBytes = $responseMessage.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $responseText = [System.Text.Encoding]::UTF8.GetString($responseBytes)
        if (-not $responseMessage.IsSuccessStatusCode) {
            throw "HTTP status=$([int]$responseMessage.StatusCode) response=$responseText"
        }
        $response = $responseText | ConvertFrom-Json
    } catch {
        throw "HTTP failed: $Method $Path error=$($_.Exception.Message) request=$requestBody"
    } finally {
        if ($null -ne $request) { $request.Dispose() }
        if ($null -ne $client) { $client.Dispose() }
    }

    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }
    return $response
}

$summary = [ordered]@{}
$runId = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "[question-paper-smoke] BaseUrl=$BaseUrl runId=$runId"

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

$paper = (Invoke-MindMarkApi GET "/api/v1/papers/$PaperId" $null $headers).data
Assert-True ($paper.status -ne "PUBLISHED" -and $paper.status -ne "ARCHIVED") "target paper must be editable"
Assert-True (-not [string]::IsNullOrWhiteSpace($paper.courseId)) "target paper has courseId"
$summary.paperId = $paper.id
$summary.paperCourseId = $paper.courseId
$summary.paperQuestionCountBefore = $paper.questions.Count

$questionTitle = "Smoke 企业级题库删除与组卷闭环 $runId"
$createBody = @{
    courseId = $paper.courseId
    title = $questionTitle
    type = "SINGLE_CHOICE"
    difficulty = "MEDIUM"
    knowledgePoints = @("企业级验收", "题库闭环")
    score = 2
    answer = "A"
    analysis = "本题用于验证题目新增、编辑、分页、组卷、移除和删除接口。"
    options = @(
        @{ key = "A"; content = "真实接口闭环" },
        @{ key = "B"; content = "仅前端 Demo" },
        @{ key = "C"; content = "无状态页面" },
        @{ key = "D"; content = "不可删除数据" }
    )
    scoringPoints = @()
}

$created = (Invoke-MindMarkApi POST "/api/v1/questions" $createBody $headers).data
Assert-True ($created.title -eq $questionTitle) "question create persists Chinese title"
Assert-True ($created.courseId -eq $paper.courseId) "question course matches paper"
$summary.createdQuestionId = $created.id

$updatedTitle = "$questionTitle - 已编辑"
$updateBody = $createBody.Clone()
$updateBody.title = $updatedTitle
$updateBody.difficulty = "HARD"
$updated = (Invoke-MindMarkApi PUT "/api/v1/questions/$($created.id)" $updateBody $headers).data
Assert-True ($updated.title -eq $updatedTitle) "question update works"
Assert-True ($updated.difficulty -eq "HARD") "question difficulty update works"
$summary.updatedQuestionTitle = $updated.title

$page = (Invoke-MindMarkApi GET "/api/v1/questions?keyword=$([uri]::EscapeDataString($runId))&courseId=$($paper.courseId)&page=1&pageSize=10" $null $headers).data
Assert-True ($page.total -ge 1) "question pagination and course filter find created question"
Assert-True (($page.items | Where-Object { $_.id -eq $created.id } | Select-Object -First 1) -ne $null) "created question appears in paged list"
$summary.paginationChecked = $true

$paperAfterAdd = (Invoke-MindMarkApi POST "/api/v1/papers/$PaperId/questions" @{
    questionId = $created.id
    score = 2
} $headers).data
Assert-True (($paperAfterAdd.questions | Where-Object { $_.questionId -eq $created.id } | Select-Object -First 1) -ne $null) "add question to paper works"
$summary.addToPaperChecked = $true

$paperAfterRemove = (Invoke-MindMarkApi DELETE "/api/v1/papers/$PaperId/questions/$($created.id)" $null $headers).data
Assert-True (($paperAfterRemove.questions | Where-Object { $_.questionId -eq $created.id } | Select-Object -First 1) -eq $null) "remove question from paper works"
$summary.removeFromPaperChecked = $true

$deleteResult = (Invoke-MindMarkApi DELETE "/api/v1/questions/$($created.id)" $null $headers).data
Assert-True ($deleteResult.physicallyDeleted -eq $true) "delete unreferenced question physically deletes"
$summary.deleteUnreferencedChecked = $true

$referencedTitle = "Smoke 被试卷引用题删除自动清理 $runId"
$refBody = $createBody.Clone()
$refBody.title = $referencedTitle
$referenced = (Invoke-MindMarkApi POST "/api/v1/questions" $refBody $headers).data
[void](Invoke-MindMarkApi POST "/api/v1/papers/$PaperId/questions" @{
    questionId = $referenced.id
    score = 2
} $headers)
$deleteReferencedResult = (Invoke-MindMarkApi DELETE "/api/v1/questions/$($referenced.id)" $null $headers).data
Assert-True (-not [string]::IsNullOrWhiteSpace($deleteReferencedResult.message)) "referenced delete returns business message"
$paperAfterReferencedDelete = (Invoke-MindMarkApi GET "/api/v1/papers/$PaperId" $null $headers).data
Assert-True (($paperAfterReferencedDelete.questions | Where-Object { $_.questionId -eq $referenced.id } | Select-Object -First 1) -eq $null) "delete referenced question auto-cleans editable paper relation"
$summary.deleteReferencedAutoCleanupChecked = $true
$summary.paperQuestionCountAfter = $paperAfterReferencedDelete.questions.Count

Write-Host "MindMark question bank + paper builder smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 40




