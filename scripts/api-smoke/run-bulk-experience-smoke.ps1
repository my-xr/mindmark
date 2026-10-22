param(
    [string] $BaseUrl = "http://localhost:18084",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [int] $QuestionCount = 500,
    [int] $StudentCount = 120,
    [int] $PaperCount = 50,
    [int] $ExamCount = 50,
    [int] $SubmittedExamCount = 50
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw "Bulk experience smoke assertion failed: $Message" }
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 60
    )

    Add-Type -AssemblyName System.Net.Http
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), [Uri]"$BaseUrl$Path")
    foreach ($key in $Headers.Keys) { [void]$request.Headers.TryAddWithoutValidation($key, [string]$Headers[$key]) }
    $requestBody = "<empty>"
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 60
        $requestBody = $Body | ConvertTo-Json -Depth 60 -Compress
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
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message) request=$requestBody"
    }
    return $response
}

function Count-Items([object] $Items) { return @($Items).Count }

function Item-Signature([object] $Items) {
    return (@($Items) | ForEach-Object {
        if ($_.PSObject.Properties.Name -contains "id") { $_.id }
        elseif ($_.PSObject.Properties.Name -contains "examId") { $_.examId }
        elseif ($_.PSObject.Properties.Name -contains "questionId") { $_.questionId }
        else { $_ | ConvertTo-Json -Compress -Depth 10 }
    }) -join ","
}

function Assert-PageResponse([object] $Page, [int] $ExpectedPageSize, [string] $Name) {
    Assert-True ($null -ne $Page.items) "$Name has items"
    Assert-True ($Page.total -ge 0) "$Name total is non-negative"
    Assert-True ($Page.page -ge 1) "$Name page is one-based"
    Assert-True ($Page.pageSize -eq $ExpectedPageSize) "$Name pageSize is normalized"
    Assert-True ($Page.totalPages -ge 1) "$Name totalPages exists"
    Assert-True ((Count-Items $Page.items) -le $ExpectedPageSize) "$Name item count <= pageSize"
    Assert-True ($null -ne $Page.hasPrevious) "$Name hasPrevious exists"
    Assert-True ($null -ne $Page.hasNext) "$Name hasNext exists"
}

function Assert-SecondPageWindow([string] $Path, [object] $FirstPage, [hashtable] $Headers, [string] $Name) {
    if ($FirstPage.total -le $FirstPage.pageSize) { return }
    $secondPage = (Invoke-MindMarkApi GET $Path $null $Headers).data
    Assert-PageResponse $secondPage $FirstPage.pageSize "$Name second page"
    Assert-True ((Item-Signature $FirstPage.items) -ne (Item-Signature $secondPage.items)) "$Name page windows differ"
}

function Assert-DescendingDate([object] $Items, [string] $PropertyName, [string] $Name) {
    $previous = $null
    foreach ($item in @($Items)) {
        $value = $item.$PropertyName
        if ($null -eq $value -or [string]::IsNullOrWhiteSpace([string]$value)) { continue }
        $current = [datetimeoffset]$value
        if ($null -ne $previous) { Assert-True ($previous -ge $current) "$Name sorted desc by $PropertyName" }
        $previous = $current
    }
}

function New-BulkQuestionPayload([string] $CourseId, [string] $RunId, [int] $Index) {
    $types = @("SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "ESSAY", "CASE_ANALYSIS", "PROGRAMMING")
    $difficulties = @("VERY_EASY", "EASY", "MEDIUM", "HARD", "VERY_HARD")
    $type = $types[($Index - 1) % $types.Count]
    $difficulty = $difficulties[($Index - 1) % $difficulties.Count]
    $kp = "批量知识点-" + ((($Index - 1) % 20) + 1)
    $longTail = if ($Index % 9 -eq 0) { "。该题题干故意加入较长的业务背景，用于验证题库表格长文本省略、详情抽屉承载、分页场景下不会撑开页面或造成横向滚动。" } else { "" }
    $score = switch ($type) {
        "SINGLE_CHOICE" { 1 }
        "MULTIPLE_CHOICE" { 2 }
        "TRUE_FALSE" { 1 }
        "FILL_BLANK" { 1 }
        "SHORT_ANSWER" { 5 }
        "ESSAY" { 10 }
        "CASE_ANALYSIS" { 10 }
        "PROGRAMMING" { 10 }
        default { 2 }
    }
    $title = "批量视觉验收 $RunId 第 $Index 题：$kp 的企业级考试场景$type$longTail"
    switch ($type) {
        "SINGLE_CHOICE" {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer="A"; analysis="选择 A。"; options=@(@{key="A";content="正确方案"},@{key="B";content="干扰项 B"},@{key="C";content="干扰项 C"},@{key="D";content="干扰项 D"}); scoringPoints=@() }
        }
        "MULTIPLE_CHOICE" {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer=@("A","C"); analysis="A、C 同时满足题意。"; options=@(@{key="A";content="权限边界清晰"},@{key="B";content="跳过审计"},@{key="C";content="分页可追踪"},@{key="D";content="关闭异常处理"}); scoringPoints=@() }
        }
        "TRUE_FALSE" {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer="True"; analysis="该说法正确。"; options=@(@{key="True";content="正确"},@{key="False";content="错误"}); scoringPoints=@() }
        }
        "FILL_BLANK" {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer=@("分页"); analysis="答案为分页。"; options=@(); scoringPoints=@(@{text="关键词正确"; score=$score}) }
        }
        "PROGRAMMING" {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer="function sum(a,b){return a+b;}"; analysis="检查函数实现、边界和可读性。"; options=@(); scoringPoints=@(@{text="函数签名正确"; score=2},@{text="逻辑正确"; score=6},@{text="代码风格清晰"; score=2}) }
        }
        default {
            return @{ courseId=$CourseId; title=$title; type=$type; difficulty=$difficulty; knowledgePoints=@($kp); score=$score; answer="围绕业务场景说明权限、状态流转、分页和审计设计。"; analysis="按要点给分。"; options=@(); scoringPoints=@(@{text="概念准确"; score=3},@{text="结合场景"; score=4},@{text="表达清晰"; score=3}) }
        }
    }
}

$runId = Get-Date -Format "yyyyMMddHHmmss"
$summary = [ordered]@{}
Write-Host "[bulk-experience-smoke] BaseUrl=$BaseUrl runId=$runId questions=$QuestionCount students=$StudentCount papers=$PaperCount exams=$ExamCount"

$health = (Invoke-MindMarkApi GET "/api/v1/system/health").data
Assert-True ($health.status -eq "UP") "api health is UP"

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$TeacherUsername; password=$TeacherPassword }).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.token)" }
$summary.teacherLogin = $true

$course = (Invoke-MindMarkApi POST "/api/v1/admin/courses" @{ code="BULK-$runId"; name="批量体验验收课程 $runId"; description="真实浏览器视觉验收与批量分页巡检数据"; status="ACTIVE" } $teacherHeaders).data
$class = (Invoke-MindMarkApi POST "/api/v1/admin/classes" @{ courseId=$course.id; code="BULK-CLS-$runId"; name="批量体验验收班级 $runId"; grade="2026"; major="软件工程"; status="ACTIVE" } $teacherHeaders).data
$summary.courseId = $course.id
$summary.classId = $class.id

$students = @()
for ($i = 1; $i -le $StudentCount; $i += 1) {
    $studentNo = "26$runId" + $i.ToString("0000")
    $students += @{ studentNo=$studentNo; name=("批量学生" + $i.ToString("000")); email=("bulk-$runId-" + $i.ToString("000") + "@student.mindmark.local"); className=$class.name; grade="2026"; major="软件工程" }
}
$importResult = (Invoke-MindMarkApi POST "/api/v1/classes/$($class.id)/students/import" @{ classId=$class.id; className=$class.name; students=$students } $teacherHeaders 120).data
Assert-True (($importResult.createdCount + $importResult.skippedCount) -ge $StudentCount) "student import covers target count"
$summary.importedStudents = $importResult.createdCount
$summary.skippedStudents = $importResult.skippedCount

$studentPage = (Invoke-MindMarkApi GET "/api/v1/classes/$($class.id)/students?page=1&pageSize=20" $null $teacherHeaders).data
Assert-PageResponse $studentPage 20 "student roster"
Assert-True ($studentPage.total -ge $StudentCount) "student roster total >= target"
Assert-SecondPageWindow "/api/v1/classes/$($class.id)/students?page=2&pageSize=20" $studentPage $teacherHeaders "student roster"

$createdQuestions = @()
for ($i = 1; $i -le $QuestionCount; $i += 1) {
    if ($i % 50 -eq 0) { Write-Host "[bulk-experience-smoke] created questions: $i/$QuestionCount" }
    $createdQuestions += (Invoke-MindMarkApi POST "/api/v1/questions" (New-BulkQuestionPayload $course.id $runId $i) $teacherHeaders 60).data
}
Assert-True ((Count-Items $createdQuestions) -eq $QuestionCount) "created question count matches"
$summary.createdQuestions = Count-Items $createdQuestions

$questionPage = (Invoke-MindMarkApi GET "/api/v1/questions?courseId=$([uri]::EscapeDataString($course.id))&page=1&pageSize=20" $null $teacherHeaders).data
Assert-PageResponse $questionPage 20 "question bank"
Assert-True ($questionPage.total -ge $QuestionCount) "question bank total >= target"
Assert-SecondPageWindow "/api/v1/questions?courseId=$([uri]::EscapeDataString($course.id))&page=2&pageSize=20" $questionPage $teacherHeaders "question bank"
Assert-DescendingDate $questionPage.items "updatedAt" "question bank"

$papers = @()
$paperCountEffective = [Math]::Min($PaperCount, [Math]::Max(1, $QuestionCount))
for ($i = 1; $i -le $paperCountEffective; $i += 1) {
    $paper = (Invoke-MindMarkApi POST "/api/v1/papers" @{ title="批量体验验收试卷 $runId-$($i.ToString('000'))"; courseId=$course.id; description="用于验证 50+ 试卷、考试批次、长列表分页和真实浏览器视觉稳定性"; durationMinutes=60 } $teacherHeaders).data
    $question = $createdQuestions[($i - 1) % $createdQuestions.Count]
    [void](Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/questions" @{ questionId=$question.id; score=$question.score } $teacherHeaders)
    $readyPaper = (Invoke-MindMarkApi PATCH "/api/v1/papers/$($paper.id)/status" @{ status="READY" } $teacherHeaders).data
    $papers += $readyPaper
}
Assert-True ((Count-Items $papers) -eq $paperCountEffective) "created paper count matches"
$summary.createdPapers = Count-Items $papers

$paperPage = (Invoke-MindMarkApi GET "/api/v1/papers?page=1&pageSize=10&keyword=$([uri]::EscapeDataString($runId))" $null $teacherHeaders).data
Assert-PageResponse $paperPage 10 "paper list"
Assert-True ($paperPage.total -ge $paperCountEffective) "paper list total >= target"
Assert-SecondPageWindow "/api/v1/papers?page=2&pageSize=10&keyword=$([uri]::EscapeDataString($runId))" $paperPage $teacherHeaders "paper list"

$exams = @()
$examCountEffective = [Math]::Min($ExamCount, $papers.Count)
$now = [DateTimeOffset]::Now
for ($i = 1; $i -le $examCountEffective; $i += 1) {
    $paper = $papers[($i - 1) % $papers.Count]
    $startAt = $now.AddMinutes(-10).ToString("o")
    $endAt = $now.AddHours(3).AddMinutes($i).ToString("o")
    $exam = (Invoke-MindMarkApi POST "/api/v1/exams" @{ title="批量体验验收考试 $runId-$($i.ToString('000'))"; paperId=$paper.id; classIds=@($class.id); startAt=$startAt; endAt=$endAt; durationMinutes=60 } $teacherHeaders).data
    $exams += $exam
}
Assert-True ((Count-Items $exams) -eq $examCountEffective) "created exam count matches"
$summary.createdExams = Count-Items $exams

$examPage = (Invoke-MindMarkApi GET "/api/v1/exams?page=1&pageSize=10" $null $teacherHeaders).data
Assert-PageResponse $examPage 10 "exam list"
Assert-True ($examPage.total -ge $examCountEffective) "exam list total >= target"
Assert-SecondPageWindow "/api/v1/exams?page=2&pageSize=10" $examPage $teacherHeaders "exam list"

$submitted = 0
if ($SubmittedExamCount -gt 0 -and $students.Count -gt 0) {
    $firstStudent = $students[0]
    $defaultPassword = $firstStudent.studentNo.Substring($firstStudent.studentNo.Length - 6)
    $studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$firstStudent.studentNo; password=$defaultPassword }).data
    Assert-True (-not [string]::IsNullOrWhiteSpace($studentLogin.token)) "bulk student token exists"
    $studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
    if ($studentLogin.mustChangePassword) {
        [void](Invoke-MindMarkApi POST "/api/v1/auth/change-password" @{ oldPassword=$defaultPassword; newPassword=("Mindmark" + $defaultPassword) } $studentHeaders 60)
    }

    $submitLimit = [Math]::Min($SubmittedExamCount, $exams.Count)
    for ($i = 0; $i -lt $submitLimit; $i += 1) {
        $exam = $exams[$i]
        $answerSheet = (Invoke-MindMarkApi GET "/api/v1/answer-sheets/by-exam/$($exam.id)" $null $studentHeaders 60).data
        $paperQuestions = (Invoke-MindMarkApi GET "/api/v1/papers/$($exam.paperId)/questions?page=1&pageSize=100" $null $teacherHeaders 60).data.items
        $answers = @($paperQuestions | ForEach-Object { @{ questionId=$_.questionId; answer="A" } })
        [void](Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$($answerSheet.id)/draft" @{ answers=$answers; clientSavedAt=([DateTimeOffset]::Now.ToString("o")); expectedVersion=$answerSheet.version } $studentHeaders 60)
        [void](Invoke-MindMarkApi POST "/api/v1/answer-sheets/$($answerSheet.id)/submit" $null $studentHeaders 60)
        $submitted += 1
    }
    $summary.submittedExamCount = $submitted

    [void](Invoke-MindMarkApi POST "/api/v1/grading-tasks/batch-auto-grade" @{ examId=$null; courseName=$course.name; scoreBand=$null; includeFailed=$true; onlyAutoGraded=$false } $teacherHeaders 120)
    [void](Invoke-MindMarkApi POST "/api/v1/grading-tasks/batch-confirm" @{ examId=$null; courseName=$course.name; scoreBand=$null; includeFailed=$true; onlyAutoGraded=$false } $teacherHeaders 120)
}

$gradingPage = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?courseName=$([uri]::EscapeDataString($course.name))&page=1&pageSize=10" $null $teacherHeaders).data
Assert-PageResponse $gradingPage 10 "grading task queue"
if ($submitted -gt 0) {
    Assert-True ($gradingPage.total -ge $submitted) "grading tasks total >= submitted exams"
    Assert-SecondPageWindow "/api/v1/grading-tasks?courseName=$([uri]::EscapeDataString($course.name))&page=2&pageSize=10" $gradingPage $teacherHeaders "grading task queue"
}

$scorePage = (Invoke-MindMarkApi GET "/api/v1/score-summaries?page=1&pageSize=10" $null $teacherHeaders).data
Assert-PageResponse $scorePage 10 "score summary list"
if ($submitted -gt 0) { Assert-True ($scorePage.total -ge $submitted) "score summary total >= submitted exams" }

$reviewPage = (Invoke-MindMarkApi GET "/api/v1/exams/reviews?page=1&pageSize=10" $null $teacherHeaders).data
Assert-PageResponse $reviewPage 10 "review report list"
if ($submitted -gt 0) { Assert-True ($reviewPage.total -ge $submitted) "review report total >= submitted exams" }

$summary.questionPageTotal = $questionPage.total
$summary.studentPageTotal = $studentPage.total
$summary.paperPageTotal = $paperPage.total
$summary.examPageTotal = $examPage.total
$summary.gradingPageTotal = $gradingPage.total
$summary.scorePageTotal = $scorePage.total
$summary.reviewPageTotal = $reviewPage.total

Write-Host "[bulk-experience-smoke] PASSED"
$summary | ConvertTo-Json -Depth 20
