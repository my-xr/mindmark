param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [int] $AiJobTimeoutSec = 240,
    [string] $AiProvider = $env:MINDMARK_SMOKE_AI_PROVIDER,
    [string] $AiProviderBaseUrl = $env:MINDMARK_SMOKE_AI_BASE_URL,
    [string] $AiProviderModel = $env:MINDMARK_SMOKE_AI_MODEL,
    [string] $AiProviderApiKeyEnvName = "MINDMARK_SMOKE_AI_API_KEY",
    [switch] $RequireAiSucceeded
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw "100-point exam smoke assertion failed: $Message" }
}

function Convert-ToIsoOffset([DateTimeOffset] $Value) { $Value.ToString("yyyy-MM-ddTHH:mm:sszzz") }

function Get-GradingTaskScore {
    param([object] $Task)
    if ($null -ne $Task.finalScore) { return [decimal]$Task.finalScore }
    if ($null -ne $Task.aiScore) { return [decimal]$Task.aiScore }
    if ($null -ne $Task.objectiveScore) { return [decimal]$Task.objectiveScore }
    return [decimal]0
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 60
    )
    $params = @{ Uri = "$BaseUrl$Path"; Method = $Method; TimeoutSec = $TimeoutSec; Headers = $Headers }
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 40
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }
    try {
        $response = Invoke-RestMethod @params
    } catch {
        $statusCode = $null; $responseBody = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($null -ne $stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseBody = $reader.ReadToEnd(); $reader.Dispose()
                }
            } catch { $responseBody = "<failed to read response body: $($_.Exception.Message)>" }
        }
        $requestBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 40 -Compress } else { "<empty>" }
        throw "HTTP failed: $Method $Path status=$statusCode request=$requestBody response=$responseBody"
    }
    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }
    return $response
}

function Wait-GradingAiJob {
    param([string] $TaskId, [hashtable] $Headers)
    $deadline = [DateTimeOffset]::Now.AddSeconds($AiJobTimeoutSec)
    $latest = $null
    do {
        Start-Sleep -Seconds 2
        $latest = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$TaskId/ai-grading-job/latest" $null $Headers).data
        if ($null -ne $latest -and @("SUCCEEDED", "SKIPPED", "FAILED") -contains $latest.status) { return $latest }
    } while ([DateTimeOffset]::Now -lt $deadline)
    if ($null -eq $latest) { throw "AI grading job was not created for task $TaskId" }
    throw "AI grading job did not finish in ${AiJobTimeoutSec}s: status=$($latest.status) id=$($latest.id)"
}

function Get-StudentDisplayAnswer {
    param(
        [object] $TeacherPaperQuestion,
        [object] $StudentPaperQuestion
    )

    $teacherQuestion = $TeacherPaperQuestion.question
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
        Assert-True ($canonicalOption.Count -eq 1) "canonical option exists for answer key $canonicalKey"
        $studentOption = @(
            @($StudentPaperQuestion.question.options) |
                Where-Object { $_.content -eq $canonicalOption[0].content } |
                Select-Object -First 1
        )
        Assert-True ($studentOption.Count -eq 1) "student display option exists for answer key $canonicalKey"
        $displayKeys += [string]$studentOption[0].key
    }

    if ($teacherQuestion.type -eq "MULTIPLE_CHOICE") {
        return @($displayKeys)
    }
    return $displayKeys[0]
}

function Get-ChoiceOptionFingerprint {
    param([object] $Paper)

    return (
        @(
            @($Paper.questions) |
                Where-Object {
                    $_.question.type -eq "SINGLE_CHOICE" -or $_.question.type -eq "MULTIPLE_CHOICE"
                } |
                ForEach-Object {
                    "$($_.questionId)=" + (
                        @($_.question.options | ForEach-Object { "$($_.key):$($_.content)" }) -join "|"
                    )
                }
        ) -join "||"
    )
}

function New-QuestionPayload {
    param(
        [string] $CourseId,
        [string] $Type,
        [string] $Difficulty,
        [decimal] $Score,
        [int] $Index
    )
    $kp = switch ($Type) {
        "SINGLE_CHOICE" { "基础概念" }
        "MULTIPLE_CHOICE" { "综合理解" }
        "TRUE_FALSE" { "概念辨析" }
        "FILL_BLANK" { "关键术语" }
        "SHORT_ANSWER" { "工程表达" }
        "PROGRAMMING" { "编程实践" }
        default { "综合能力" }
    }
    switch ($Type) {
        "SINGLE_CHOICE" {
            return @{
                courseId = $CourseId; title = "100 分闭环单选题 $Index：下列哪项最符合模块化设计原则？"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = "A"; analysis = "模块化设计强调高内聚、低耦合，便于维护和测试。"
                options = @(@{ key="A"; content="高内聚、低耦合" }, @{ key="B"; content="所有逻辑写入单个函数" }, @{ key="C"; content="忽略接口边界" }, @{ key="D"; content="禁止复用组件" })
                scoringPoints = @()
            }
        }
        "MULTIPLE_CHOICE" {
            return @{
                courseId = $CourseId; title = "100 分闭环多选题 $Index：企业级考试系统应具备哪些能力？"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = @("A", "C"); analysis = "企业级考试系统需要权限控制和审计追踪，确保安全与可追溯。"
                options = @(@{ key="A"; content="基于角色的权限控制" }, @{ key="B"; content="所有用户共享一个账号" }, @{ key="C"; content="关键操作审计记录" }, @{ key="D"; content="生产环境关闭异常处理" })
                scoringPoints = @()
            }
        }
        "TRUE_FALSE" {
            return @{
                courseId = $CourseId; title = "100 分闭环判断题 $Index：考试提交后应生成可追踪的批改任务。"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = "True"; analysis = "提交答卷后进入批改任务队列，便于自动判分、教师复核和成绩发布。"
                options = @(@{ key="True"; content="正确" }, @{ key="False"; content="错误" })
                scoringPoints = @()
            }
        }
        "FILL_BLANK" {
            return @{
                courseId = $CourseId; title = "100 分闭环填空题 $Index：用于记录用户关键操作并支持追溯的能力称为____。"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = "审计"; analysis = "审计日志用于记录关键操作、执行结果和时间，支持安全追溯。"
                options = @()
                scoringPoints = @()
            }
        }
        "SHORT_ANSWER" {
            return @{
                courseId = $CourseId; title = "100 分闭环简答题 $Index：说明考试系统中教师复核环节的作用。"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = "教师复核用于校验系统自动判分结果，处理主观题争议、不及格保护和异常答卷，确保成绩发布前准确、公平、可追溯。"; analysis = "答案应覆盖自动判分校验、异常处理、公平性和可追溯性。"
                options = @()
                scoringPoints = @(@{ description="说明校验系统自动判分"; score=2; keywords=@("自动判分", "校验") }, @{ description="说明处理异常或争议"; score=2; keywords=@("异常", "争议", "不及格") }, @{ description="说明公平和可追溯"; score=1; keywords=@("公平", "追溯") })
            }
        }
        "PROGRAMMING" {
            return @{
                courseId = $CourseId; title = "100 分闭环编程题 $Index：实现一个函数，统计数组中及格分数的数量。"; type = $Type; difficulty = $Difficulty; knowledgePoints = @($kp); score = $Score
                answer = "遍历分数数组，判断每个分数是否大于等于 60，满足条件则计数加一，最后返回计数。需处理空数组并保持线性时间复杂度。"; analysis = "评分关注边界处理、遍历逻辑、阈值判断和复杂度。"
                options = @()
                scoringPoints = @(@{ description="正确遍历数组"; score=3; keywords=@("遍历", "数组") }, @{ description="使用大于等于 60 的判断"; score=3; keywords=@("60", "大于等于", ">=") }, @{ description="返回正确计数并处理空数组"; score=3; keywords=@("计数", "空数组") }, @{ description="复杂度为 O(n)"; score=1; keywords=@("O(n)", "线性") })
            }
        }
    }
}

function Add-Questions {
    param([string] $CourseId, [hashtable] $Headers)
    $created = @()
    $rules = @(
        @{ type="SINGLE_CHOICE"; count=20; score=1; difficulties=@("EASY", "MEDIUM") },
        @{ type="MULTIPLE_CHOICE"; count=10; score=2; difficulties=@("MEDIUM", "HARD") },
        @{ type="TRUE_FALSE"; count=10; score=1; difficulties=@("VERY_EASY", "EASY", "MEDIUM") },
        @{ type="FILL_BLANK"; count=10; score=1; difficulties=@("EASY", "MEDIUM") },
        @{ type="SHORT_ANSWER"; count=4; score=5; difficulties=@("MEDIUM", "HARD") },
        @{ type="PROGRAMMING"; count=2; score=10; difficulties=@("HARD", "VERY_HARD") }
    )
    foreach ($rule in $rules) {
        for ($i = 1; $i -le $rule.count; $i += 1) {
            $difficulty = $rule.difficulties[($i - 1) % $rule.difficulties.Count]
            $payload = New-QuestionPayload $CourseId $rule.type $difficulty ([decimal]$rule.score) $i
            $created += (Invoke-MindMarkApi POST "/api/v1/questions" $payload $Headers 60).data
        }
    }
    return $created
}

$runId = Get-Date -Format "yyyyMMddHHmmss"
$summary = [ordered]@{}
Write-Host "[100-point-exam-smoke] BaseUrl=$BaseUrl runId=$runId"
$summary.actuator = (Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get -TimeoutSec 30).status

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username = $TeacherUsername; password = $TeacherPassword }).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.token)" }

$aiApiKey = if ([string]::IsNullOrWhiteSpace($AiProviderApiKeyEnvName)) { $null } else { [Environment]::GetEnvironmentVariable($AiProviderApiKeyEnvName) }
if (-not [string]::IsNullOrWhiteSpace($aiApiKey)) {
    $effectiveAiProvider = if ([string]::IsNullOrWhiteSpace($AiProvider)) { "OPENAI" } else { $AiProvider }
    $effectiveAiBaseUrl = if ([string]::IsNullOrWhiteSpace($AiProviderBaseUrl)) { "https://api.openai.com/v1" } else { $AiProviderBaseUrl }
    $effectiveAiModel = if ([string]::IsNullOrWhiteSpace($AiProviderModel)) { "gpt-4.1-mini" } else { $AiProviderModel }
    $savedProvider = (Invoke-MindMarkApi PUT "/api/v1/ai/provider-settings" @{ provider=$effectiveAiProvider; baseUrl=$effectiveAiBaseUrl; model=$effectiveAiModel; apiKey=$aiApiKey } $teacherHeaders).data
    $providerTest = (Invoke-MindMarkApi POST "/api/v1/ai/provider-settings/test" @{ provider=$effectiveAiProvider; baseUrl=$effectiveAiBaseUrl; model=$effectiveAiModel } $teacherHeaders 90).data
    $summary.aiProviderConfigured = $true
    $summary.aiProviderTestOk = [bool]$providerTest.success
    $summary.aiProvider = $savedProvider.provider
    $summary.aiProviderModel = $savedProvider.model
    $summary.aiProviderBaseUrl = $savedProvider.baseUrl
    $summary.aiProviderTestMessage = $providerTest.message
    if ($RequireAiSucceeded -and -not [bool]$providerTest.success) { throw "AI provider connection test failed: $($providerTest.message)" }
} else {
    $summary.aiProviderConfigured = $false
    $summary.aiProviderApiKeyEnvName = $AiProviderApiKeyEnvName
}

$course = (Invoke-MindMarkApi POST "/api/v1/admin/courses" @{ code="P100-$runId"; name="100 分闭环验收课程 $runId"; description="Generated by run-100-point-exam-smoke.ps1"; status="ACTIVE" } $teacherHeaders).data
$class = (Invoke-MindMarkApi POST "/api/v1/admin/classes" @{ courseId=$course.id; code="P100-CLS-$runId"; name="100 分闭环验收班级 $runId"; grade="2026"; major="软件工程"; status="ACTIVE" } $teacherHeaders).data
$summary.courseId = $course.id
$summary.classId = $class.id

$createdQuestions = Add-Questions $course.id $teacherHeaders
Assert-True ($createdQuestions.Count -eq 56) "56 active questions are created for a 100-point paper"
$summary.createdQuestionCount = $createdQuestions.Count

$paper = (Invoke-MindMarkApi POST "/api/v1/papers" @{ title="100 分真实闭环验收试卷 $runId"; courseId=$course.id; description="覆盖单选、多选、判断、填空、简答、编程的 100 分真实验收试卷"; durationMinutes=90 } $teacherHeaders).data
$summary.paperId = $paper.id

$composeRequest = @{
    targetScore = 100
    mode = "REPLACE"
    rules = @(
        @{ type="SINGLE_CHOICE"; count=20; score=1; difficulties=@("EASY", "MEDIUM"); knowledgePoints=@() },
        @{ type="MULTIPLE_CHOICE"; count=10; score=2; difficulties=@("MEDIUM", "HARD"); knowledgePoints=@() },
        @{ type="TRUE_FALSE"; count=10; score=1; difficulties=@("VERY_EASY", "EASY", "MEDIUM"); knowledgePoints=@() },
        @{ type="FILL_BLANK"; count=10; score=1; difficulties=@("EASY", "MEDIUM"); knowledgePoints=@() },
        @{ type="SHORT_ANSWER"; count=4; score=5; difficulties=@("MEDIUM", "HARD"); knowledgePoints=@() },
        @{ type="PROGRAMMING"; count=2; score=10; difficulties=@("HARD", "VERY_HARD"); knowledgePoints=@() }
    )
}
$preview = (Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/compose/agent/preview" $composeRequest $teacherHeaders 90).data
Assert-True ($preview.ready -eq $true) "agent compose preview is ready"
Assert-True ([decimal]$preview.plannedFinalScore -eq 100) "agent compose preview total is 100"
$composed = (Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/compose/agent" $composeRequest $teacherHeaders 90).data
Assert-True ([decimal]$composed.actualScore -eq 100) "composed paper total is 100"
Assert-True ($composed.addedCount -eq 56) "composed paper contains 56 questions"
$paper = (Invoke-MindMarkApi PATCH "/api/v1/papers/$($paper.id)/status" @{ status="READY" } $teacherHeaders).data
Assert-True ([decimal]$paper.totalScore -eq 100) "ready paper total score is 100"
$summary.paperTotalScore = $paper.totalScore
$summary.paperQuestionCount = $paper.questions.Count

$studentNo = "202699$($runId.Substring(6))"
$initialPassword = $studentNo.Substring($studentNo.Length - 6)
$newPassword = "PointSmoke$runId"
$import = (Invoke-MindMarkApi POST "/api/v1/classes/$($class.id)/students/import" @{ className=$class.name; students=@(@{ studentNo=$studentNo; name="100 分验收学生 $runId"; email="$studentNo@student.mindmark.local"; className=$class.name; grade="2026"; major="软件工程" }) } $teacherHeaders).data
Assert-True ($import.createdCount -eq 1) "student import creates one account"
$studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$studentNo; password=$initialPassword }).data
$studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
if ($studentLogin.mustChangePassword -eq $true) {
    [void](Invoke-MindMarkApi POST "/api/v1/auth/change-password" @{ oldPassword=$initialPassword; newPassword=$newPassword } $studentHeaders)
    $studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$studentNo; password=$newPassword }).data
    $studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
}

$now = [DateTimeOffset]::Now
$exam = (Invoke-MindMarkApi POST "/api/v1/exams" @{ title="100 分考试闭环验收 $runId"; paperId=$paper.id; classIds=@($class.id); startAt=Convert-ToIsoOffset($now.AddMinutes(-1)); endAt=Convert-ToIsoOffset($now.AddMinutes(30)); durationMinutes=30 } $teacherHeaders).data
Assert-True ($exam.status -eq "ONGOING") "100-point exam is ongoing"
Assert-True ([decimal]$exam.totalScore -eq 100) "exam total score is 100"
$summary.examId = $exam.id

$studentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $exam.id } | Select-Object -First 1)
Assert-True ($null -ne $studentExam) "exam appears in student list"
$answerSheetId = $studentExam.answerSheetId
$paperQuestions = (Invoke-MindMarkApi GET "/api/v1/papers/$($paper.id)/questions?page=1&pageSize=100" $null $teacherHeaders).data.items
Assert-True ($paperQuestions.Count -eq 56) "paper question page returns 56 questions"
$answerKey = (Invoke-MindMarkApi GET "/api/v1/papers/$($paper.id)/answer-key" $null $teacherHeaders).data
Assert-True ($answerKey.items.Count -eq 56) "teacher reference answer key has all 56 questions"

$studentPaper = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($exam.id)/paper" $null $studentHeaders).data
$studentPaperAfterRefresh = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($exam.id)/paper" $null $studentHeaders).data
Assert-True ($studentPaper.questions.Count -eq 56) "student randomized paper has all 56 questions"
$teacherChoiceFingerprint = Get-ChoiceOptionFingerprint $paper
$studentChoiceFingerprint = Get-ChoiceOptionFingerprint $studentPaper
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherChoiceFingerprint)) "teacher paper contains choice options"
Assert-True (
    $studentChoiceFingerprint -ne $teacherChoiceFingerprint
) "student single/multiple-choice option content is actually shuffled from canonical order"
Assert-True (
    $studentChoiceFingerprint -eq (Get-ChoiceOptionFingerprint $studentPaperAfterRefresh)
) "student choice option order remains stable after refresh"
$studentPaperQuestionById = @{}
foreach ($studentPaperQuestion in @($studentPaper.questions)) {
    $studentPaperQuestionById[$studentPaperQuestion.questionId] = $studentPaperQuestion
    Assert-True ($null -eq $studentPaperQuestion.question.answer) "student paper does not expose answer keys"
    Assert-True ($null -eq $studentPaperQuestion.question.analysis) "student paper does not expose analysis"
    Assert-True ($null -eq $studentPaperQuestion.question.scoringPoints) "student paper does not expose scoring points"
}

$answers = @()
foreach ($item in $paperQuestions) {
    $q = $item.question
    $studentPaperQuestion = $studentPaperQuestionById[$q.id]
    Assert-True ($null -ne $studentPaperQuestion) "student paper contains teacher paper question $($q.id)"
    $answer = Get-StudentDisplayAnswer $item $studentPaperQuestion
    $answers += @{ questionId = $q.id; answer = $answer }
}
[void](Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$answerSheetId/draft" @{ answers=$answers; clientSavedAt=Convert-ToIsoOffset([DateTimeOffset]::Now); expectedVersion=0 } $studentHeaders 90)
$submitted = (Invoke-MindMarkApi POST "/api/v1/answer-sheets/$answerSheetId/submit" $null $studentHeaders).data
Assert-True ($submitted.status -eq "SUBMITTED" -or $submitted.status -eq "GRADING" -or $submitted.status -eq "GRADED") "answer sheet submitted"

$taskId = "GT-$answerSheetId"
$autoGraded = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/auto-grade" $null $teacherHeaders 90).data
Assert-True (@("AI_CHECKED", "REVIEWED") -contains $autoGraded.status) "auto grading finishes system scoring"
$autoGradeScore = Get-GradingTaskScore $autoGraded
Assert-True ($autoGradeScore -le 100) "system total score does not exceed 100"
$summary.gradingTaskId = $taskId
$summary.autoGradeStatus = $autoGraded.status
$summary.autoGradeTotalScore = $autoGradeScore

$itemsPage1 = (Invoke-MindMarkApi GET "/api/v1/grading-tasks/$taskId/items?page=1&pageSize=100" $null $teacherHeaders).data
Assert-True ($itemsPage1.total -eq 56) "grading item page has 56 rows"
$objectiveCount = ($itemsPage1.items | Where-Object { $_.objective -eq $true }).Count
$subjectiveCount = ($itemsPage1.items | Where-Object { $_.objective -eq $false }).Count
Assert-True ($objectiveCount -eq 50) "50 objective items are auto graded"
Assert-True ($subjectiveCount -eq 6) "6 subjective/programming items are available for AI grading"
$objectiveItems = @($itemsPage1.items | Where-Object { $_.objective -eq $true })
$randomizedChoiceItems = @(
    $objectiveItems | Where-Object {
        $_.questionType -eq "SINGLE_CHOICE" -or $_.questionType -eq "MULTIPLE_CHOICE"
    }
)
$otherObjectiveItems = @(
    $objectiveItems | Where-Object {
        $_.questionType -eq "TRUE_FALSE" -or $_.questionType -eq "FILL_BLANK"
    }
)
Assert-True ($randomizedChoiceItems.Count -eq 30) "30 randomized single/multiple-choice items are auto graded"
Assert-True (
    @($randomizedChoiceItems | Where-Object { $_.correct -ne $true }).Count -eq 0
) "randomized single/multiple-choice display answers restore to canonical answers for auto grading"
Assert-True (
    @($otherObjectiveItems | Where-Object { $_.correct -ne $true }).Count -eq 0
) "true-false and fill-blank reference answers are preserved with UTF-8 payloads"
$objectiveScore = [decimal](@($objectiveItems | Measure-Object -Property finalScore -Sum).Sum)
Assert-True ($objectiveScore -eq 60) "all 60 objective points are awarded after option-order restoration"
$summary.objectiveItemCount = $objectiveCount
$summary.subjectiveItemCount = $subjectiveCount
$summary.choiceOptionsActuallyShuffled = $true
$summary.randomizedChoiceGradingVerified = $true
$summary.referenceAnswerKeyVerified = $true

$job = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/ai-grading-job" $null $teacherHeaders 90).data
Assert-True (-not [string]::IsNullOrWhiteSpace($job.id)) "AI grading job id exists"
$finalJob = Wait-GradingAiJob $taskId $teacherHeaders
Assert-True (@("SUCCEEDED", "SKIPPED", "FAILED") -contains $finalJob.status) "AI grading job reaches terminal status"
if ($RequireAiSucceeded) { Assert-True ($finalJob.status -eq "SUCCEEDED") "AI grading job must succeed when -RequireAiSucceeded is used" }
$summary.aiJobStatus = $finalJob.status
$summary.aiJobDurationMs = $finalJob.durationMs
$summary.aiJobSummary = $finalJob.resultSummary
$summary.aiJobError = $finalJob.errorMessage

$confirmed = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$taskId/confirm-system-score" $null $teacherHeaders 90).data
Assert-True ($confirmed.status -eq "REVIEWED") "teacher can confirm system score"
$confirmedScore = Get-GradingTaskScore $confirmed
Assert-True ($confirmedScore -le 100) "confirmed total score does not exceed 100"
$summary.confirmedScore = $confirmedScore

Write-Host "MindMark 100-point exam closed-loop smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 40
