param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminUsername = "teacher@mindmark.local",
    [string]$AdminPassword = "dev-password",
    [string]$RunId = (Get-Date -Format "yyyyMMddHHmmss"),
    [string]$SummaryPath = ""
)

$ErrorActionPreference = "Stop"

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Chapter scope smoke assertion failed: $Message" }
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string]$Method,
        [Parameter(Mandatory = $true)] [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $uri = "$BaseUrl$Path"
    $requestBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 40 -Compress } else { "<empty>" }
    $parameters = @{
        Method = $Method
        Uri = $uri
        Headers = $Headers
        TimeoutSec = 60
    }
    if ($null -ne $Body) {
        $parameters.ContentType = "application/json; charset=utf-8"
        $jsonBody = $Body | ConvertTo-Json -Depth 40
        $parameters.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }

    try {
        $response = Invoke-RestMethod @parameters
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        throw "HTTP failed: $Method $Path status=$status request=$requestBody error=$($_.Exception.Message)"
    }
    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }
    return $response
}

function Get-Items($Value) {
    if ($null -eq $Value) { return @() }
    if ($Value -is [System.Array]) { return @($Value) }
    return @($Value)
}

function Convert-ToChapterNumber([string]$Label) {
    $match = [regex]::Match($Label, '第\s*(\d+)\s*章')
    if (-not $match.Success) { return $null }
    return [int]$match.Groups[1].Value
}

if ($RunId -notmatch '^[A-Za-z0-9_-]{6,80}$') {
    throw "RunId must contain only letters, digits, '_' or '-' and be 6-80 characters long."
}
if ([string]::IsNullOrWhiteSpace($SummaryPath)) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
    $SummaryPath = Join-Path $repoRoot ("target\maintenance\chapter-scope-smoke-{0}.json" -f $RunId)
}

Write-Host "[chapter-scope-smoke] BaseUrl=$BaseUrl runId=$RunId"
$login = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username = $AdminUsername; password = $AdminPassword }).data
Assert-True (-not [string]::IsNullOrWhiteSpace($login.token)) "admin token exists"
$headers = @{ Authorization = "Bearer $($login.token)" }

$course = (Invoke-MindMarkApi POST "/api/v1/admin/courses" @{
    code = "CHAPTER-$RunId"
    name = "JavaWeb 章节范围验收课程 $RunId"
    description = "Created by run-chapter-scope-smoke.ps1"
    status = "ACTIVE"
} $headers).data
Assert-True (-not [string]::IsNullOrWhiteSpace($course.id)) "chapter smoke course created"

$chapters = @()
for ($chapterNo = 1; $chapterNo -le 10; $chapterNo += 1) {
    $chapter = (Invoke-MindMarkApi POST "/api/v1/admin/courses/$($course.id)/chapters" @{
        chapterNo = $chapterNo
        title = "JavaWeb 第 $chapterNo 章"
        description = "章节范围验收章节 $chapterNo"
        status = "ACTIVE"
    } $headers).data
    $chapters += $chapter
}
Assert-True ($chapters.Count -eq 10) "chapters 1-10 created"

$questions = @()
for ($index = 0; $index -lt $chapters.Count; $index += 1) {
    $chapter = $chapters[$index]
    $chapterNo = $index + 1
    $question = (Invoke-MindMarkApi POST "/api/v1/questions" @{
        courseId = $course.id
        chapterId = $chapter.id
        title = "章节范围题目第 $chapterNo 章 $RunId"
        type = "SINGLE_CHOICE"
        difficulty = "MEDIUM"
        knowledgePoints = @("JavaWeb")
        score = 1
        answer = "A"
        analysis = "章节范围 Smoke 题目解析。"
        options = @(
            @{ key = "A"; content = "正确选项" },
            @{ key = "B"; content = "干扰选项" }
        )
        scoringPoints = @()
    } $headers).data
    Assert-True ($question.chapterId -eq $chapter.id) "question $chapterNo belongs to its chapter"
    Assert-True ([int]$question.chapterNo -eq $chapterNo) "question $chapterNo stores chapter number"
    $questions += $question
}
Assert-True ($questions.Count -eq 10) "one question per chapter created"

$paper = (Invoke-MindMarkApi POST "/api/v1/papers" @{
    title = "JavaWeb 第 1-8 章范围试卷 $RunId"
    courseId = $course.id
    description = "验证组卷不会抽取第 9、10 章题目"
    durationMinutes = 60
} $headers).data
$rule = @{
    type = "SINGLE_CHOICE"
    count = 8
    score = 1
    difficulties = @("MEDIUM")
    chapterIds = @()
    chapterFromNo = 1
    chapterToNo = 8
    knowledgePoints = @()
}
$composeRequest = @{
    targetScore = 8
    mode = "REPLACE"
    rules = @($rule)
}

$preview = (Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/compose/random/preview" $composeRequest $headers).data
Assert-True ($preview.ready -eq $true) "chapter 1-8 random compose preview is ready"
Assert-True ([decimal]$preview.plannedFinalScore -eq 8) "preview score is 8"
$composed = (Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/compose/random" $composeRequest $headers).data
$composedPaper = $composed.paper
$selected = Get-Items $composedPaper.questions
Assert-True ($selected.Count -eq 8) "composed paper contains exactly eight questions"
$selectedChapterNumbers = @($selected | ForEach-Object { [int]$_.question.chapterNo })
Assert-True (@($selectedChapterNumbers | Where-Object { $_ -lt 1 -or $_ -gt 8 }).Count -eq 0) "paper excludes chapters 9 and 10"
Assert-True (@($selectedChapterNumbers | Sort-Object -Unique).Count -eq 8) "paper covers every chapter from 1 through 8"

$distribution = Get-Items $composed.qualityReport.chapterDistribution
$distributionNumbers = @($distribution | ForEach-Object { Convert-ToChapterNumber $_.label } | Where-Object { $null -ne $_ })
Assert-True (@($distributionNumbers | Sort-Object -Unique).Count -eq 8) "quality report contains eight chapter buckets"
Assert-True (@($distributionNumbers | Where-Object { $_ -lt 1 -or $_ -gt 8 }).Count -eq 0) "quality report excludes chapters 9 and 10"

$markdown = @"
## 单选题（每题 1 分）

**题目 11**（分值：1分）
**题目**：Markdown 导入章节归属验证 $RunId
A. 正确选项
B. 干扰选项
> **答案**：A
> **解析**：验证 Markdown 导入指定章节。
"@
$markdownResult = (Invoke-MindMarkApi POST "/api/v1/questions/import/markdown" @{
    courseId = $course.id
    chapterId = $chapters[9].id
    fileName = "chapter-scope-$RunId.md"
    markdown = $markdown
} $headers).data
Assert-True ([int]$markdownResult.importedCount -eq 1) "markdown import creates one question"
$imported = Get-Items $markdownResult.importedQuestions | Select-Object -First 1
Assert-True ($imported.chapterId -eq $chapters[9].id) "markdown import stores the selected chapter id"
Assert-True ([int]$imported.chapterNo -eq 10) "markdown import stores chapter 10"

$chapterTenQuestions = (Invoke-MindMarkApi GET "/api/v1/questions?courseId=$($course.id)&chapterId=$($chapters[9].id)&page=1&pageSize=20" $null $headers).data
$chapterTenItems = Get-Items $chapterTenQuestions.items
Assert-True ([int]$chapterTenQuestions.total -eq 2) "chapter 10 filter returns the original and imported questions"
Assert-True (@($chapterTenItems | Where-Object { $_.title -eq "Markdown 导入章节归属验证 $RunId" }).Count -eq 1) "chapter 10 filter returns the imported question"

$summary = [ordered]@{
    runId = $RunId
    courseId = $course.id
    chapterCount = $chapters.Count
    questionCount = $questions.Count
    paperId = $paper.id
    composedQuestionCount = $selected.Count
    selectedChapterNumbers = @($selectedChapterNumbers | Sort-Object)
    qualityReportChapterNumbers = @($distributionNumbers | Sort-Object -Unique)
    markdownImportedChapterNo = [int]$imported.chapterNo
}
$summaryParent = Split-Path -Parent $SummaryPath
if (-not [string]::IsNullOrWhiteSpace($summaryParent)) {
    New-Item -ItemType Directory -Path $summaryParent -Force | Out-Null
}
[System.IO.File]::WriteAllText($SummaryPath, ($summary | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[chapter-scope-smoke] summary=$SummaryPath"
Write-Host "[chapter-scope-smoke] PASS chapters=1-10 composed=1-8 markdown=10" -ForegroundColor Green
