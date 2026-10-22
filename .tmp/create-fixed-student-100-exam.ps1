param(
    [string] $BaseUrl = "http://localhost:18084",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $StudentUsername = "20260722120655",
    [string] $StudentPassword = "Mindmark123"
)

$ErrorActionPreference = "Stop"

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory=$true)] [string] $Method,
        [Parameter(Mandatory=$true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 60
    )
    $params = @{ Uri = "$BaseUrl$Path"; Method = $Method; TimeoutSec = $TimeoutSec; Headers = $Headers }
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 50
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }
    try {
        return Invoke-RestMethod @params
    } catch {
        $statusCode = $null; $responseBody = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseBody = $reader.ReadToEnd(); $reader.Dispose()
                }
            } catch {}
        }
        $requestBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 50 -Compress } else { "<empty>" }
        throw "HTTP failed: $Method $Path status=$statusCode request=$requestBody response=$responseBody"
    }
}

function New-QuestionPayload {
    param([string] $CourseId, [string] $Type, [string] $Difficulty, [decimal] $Score, [int] $Index)
    $kp = switch ($Type) {
        "SINGLE_CHOICE" { "工程基础" }
        "MULTIPLE_CHOICE" { "系统设计" }
        "TRUE_FALSE" { "概念辨析" }
        "FILL_BLANK" { "关键术语" }
        "SHORT_ANSWER" { "工程表达" }
        "PROGRAMMING" { "编程实践" }
        default { "综合能力" }
    }
    switch ($Type) {
        "SINGLE_CHOICE" {
            return @{ courseId=$CourseId; title="100分综合单选题 $Index：在企业级前端项目中，下列哪项最符合组件化设计原则？"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer="A"; analysis="组件化设计强调职责清晰、接口稳定和复用性，避免把全部逻辑堆在单个文件中。"; options=@(@{key="A";content="职责清晰、接口稳定"},@{key="B";content="所有逻辑集中到一个组件"},@{key="C";content="忽略状态边界"},@{key="D";content="禁止组件复用"}); scoringPoints=@() }
        }
        "MULTIPLE_CHOICE" {
            return @{ courseId=$CourseId; title="100分综合多选题 $Index：一个可靠的在线考试系统通常需要具备哪些能力？"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer=@("A","C"); analysis="考试系统需要身份鉴权、权限边界、审计追踪和稳定的数据保存机制。"; options=@(@{key="A";content="基于角色的权限控制"},@{key="B";content="所有学生共享同一账号"},@{key="C";content="关键操作审计追踪"},@{key="D";content="答卷只保存在浏览器内存"}); scoringPoints=@() }
        }
        "TRUE_FALSE" {
            return @{ courseId=$CourseId; title="100分综合判断题 $Index：学生交卷后，系统应生成可追踪的答卷和批改任务。"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer="True"; analysis="交卷后的答卷、批改任务和成绩发布链路都应可追踪，便于复核与审计。"; options=@(@{key="True";content="正确"},@{key="False";content="错误"}); scoringPoints=@() }
        }
        "FILL_BLANK" {
            return @{ courseId=$CourseId; title="100分综合填空题 $Index：用于记录用户关键操作并支持追溯的能力通常称为____。"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer="审计"; analysis="审计日志记录操作者、操作对象、时间和结果，用于安全追溯。"; options=@(); scoringPoints=@() }
        }
        "SHORT_ANSWER" {
            return @{ courseId=$CourseId; title="100分综合简答题 $Index：请说明考试系统中教师复核环节的作用。"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer="教师复核用于校验系统自动判分结果，处理主观题争议、不及格风险和异常答卷，确保成绩发布前准确、公平、可追溯。"; analysis="答案应覆盖自动判分校验、异常处理、公平性和可追溯性。"; options=@(); scoringPoints=@(@{description="说明校验系统自动判分";score=2;keywords=@("自动判分","校验")},@{description="说明处理异常或争议";score=2;keywords=@("异常","争议","不及格")},@{description="说明公平和可追溯";score=1;keywords=@("公平","追溯")}) }
        }
        "PROGRAMMING" {
            return @{ courseId=$CourseId; title="100分综合编程题 $Index：实现一个函数，统计数组中及格分数的数量。"; type=$Type; difficulty=$Difficulty; knowledgePoints=@($kp); score=$Score; answer="遍历分数数组，判断每个分数是否大于等于 60，满足条件则计数加一，最后返回计数。需处理空数组并保持线性时间复杂度。"; analysis="评分关注边界处理、遍历逻辑、阈值判断和复杂度。"; options=@(); scoringPoints=@(@{description="正确遍历数组";score=3;keywords=@("遍历","数组")},@{description="使用大于等于 60 的判断";score=3;keywords=@("60","大于等于",">=")},@{description="返回正确计数并处理空数组";score=3;keywords=@("计数","空数组")},@{description="复杂度为 O(n)";score=1;keywords=@("O(n)","线性")}) }
        }
    }
}

function Add-Questions {
    param([string] $CourseId, [hashtable] $Headers)
    $created = @()
    $rules = @(
        @{ type="SINGLE_CHOICE"; count=10; score=1; difficulties=@("EASY","MEDIUM") },
        @{ type="MULTIPLE_CHOICE"; count=10; score=2; difficulties=@("MEDIUM","HARD") },
        @{ type="TRUE_FALSE"; count=10; score=1; difficulties=@("VERY_EASY","EASY","MEDIUM") },
        @{ type="FILL_BLANK"; count=10; score=1; difficulties=@("EASY","MEDIUM") },
        @{ type="SHORT_ANSWER"; count=4; score=5; difficulties=@("MEDIUM","HARD") },
        @{ type="PROGRAMMING"; count=3; score=10; difficulties=@("HARD","VERY_HARD") }
    )
    foreach ($rule in $rules) {
        for ($i=1; $i -le $rule.count; $i += 1) {
            $difficulty = $rule.difficulties[($i - 1) % $rule.difficulties.Count]
            $payload = New-QuestionPayload $CourseId $rule.type $difficulty ([decimal]$rule.score) $i
            $created += (Invoke-MindMarkApi POST "/api/v1/questions" $payload $Headers 60).data
        }
    }
    return $created
}

$runId = Get-Date -Format "yyyyMMddHHmmss"
$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$TeacherUsername; password=$TeacherPassword }).data
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.token)" }

$studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{ username=$StudentUsername; password=$StudentPassword }).data
$studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }

$classes = (Invoke-MindMarkApi GET "/api/v1/admin/classes" $null $teacherHeaders).data
$targetClass = $null
$targetStudent = $null
foreach ($class in $classes) {
    $studentsPage = (Invoke-MindMarkApi GET "/api/v1/classes/$($class.id)/students?page=1&pageSize=500" $null $teacherHeaders).data
    $match = $studentsPage.items | Where-Object { $_.studentNo -eq $StudentUsername } | Select-Object -First 1
    if ($match) { $targetClass = $class; $targetStudent = $match; break }
}
if ($null -eq $targetClass) { throw "Student $StudentUsername was not found in manageable classes." }

$course = ((Invoke-MindMarkApi GET "/api/v1/admin/courses" $null $teacherHeaders).data | Where-Object { $_.id -eq $targetClass.courseId } | Select-Object -First 1)
if ($course) {
    $course = (Invoke-MindMarkApi PATCH "/api/v1/admin/courses/$($course.id)" @{ code=$course.code; name="MindMark 视觉验收课程"; description="固定学生账号 100 分混合题型考试验收课程"; status="ACTIVE" } $teacherHeaders).data
}
$targetClass = (Invoke-MindMarkApi PATCH "/api/v1/admin/classes/$($targetClass.id)" @{ courseId=$targetClass.courseId; code=$targetClass.code; name="MindMark 视觉验收班级"; grade="2026"; major="软件工程"; status="ACTIVE" } $teacherHeaders).data

$createdQuestions = Add-Questions $targetClass.courseId $teacherHeaders
$totalQuestionScore = ($createdQuestions | Measure-Object -Property score -Sum).Sum
if ([decimal]$totalQuestionScore -ne 100) { throw "Created question score is not 100: $totalQuestionScore" }

$paper = (Invoke-MindMarkApi POST "/api/v1/papers" @{ title="100分混合题型上机考试试卷 $runId"; courseId=$targetClass.courseId; description="覆盖单选、多选、判断、填空、简答、编程六类题型，总分 100 分。"; durationMinutes=90 } $teacherHeaders).data
foreach ($question in $createdQuestions) {
    $paper = (Invoke-MindMarkApi POST "/api/v1/papers/$($paper.id)/questions" @{ questionId=$question.id; score=$question.score } $teacherHeaders).data
}
$paper = (Invoke-MindMarkApi PATCH "/api/v1/papers/$($paper.id)/status" @{ status="READY" } $teacherHeaders).data
if ([decimal]$paper.totalScore -ne 100) { throw "Paper total score is not 100: $($paper.totalScore)" }

$now = [DateTimeOffset]::Now
$exam = (Invoke-MindMarkApi POST "/api/v1/exams" @{ title="100分混合题型上机考试 $runId"; paperId=$paper.id; classIds=@($targetClass.id); startAt=$now.AddMinutes(-2).ToString("o"); endAt=$now.AddHours(3).ToString("o"); durationMinutes=90 } $teacherHeaders).data

$studentExams = (Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data
$studentExam = $studentExams | Where-Object { $_.id -eq $exam.id } | Select-Object -First 1
if ($null -eq $studentExam) { throw "Created exam does not appear in student exam list." }

$summary = [ordered]@{
    runId = $runId
    studentUsername = $StudentUsername
    studentPassword = $StudentPassword
    classId = $targetClass.id
    className = $targetClass.name
    courseId = $targetClass.courseId
    examId = $exam.id
    examTitle = $exam.title
    examStatus = $exam.status
    paperId = $paper.id
    paperTitle = $paper.title
    paperTotalScore = $paper.totalScore
    paperQuestionCount = $paper.questions.Count
    studentExamStatus = $studentExam.status
    answerSheetId = $studentExam.answerSheetId
    composition = @(
        @{ type="SINGLE_CHOICE"; label="单选题"; count=10; score=10 },
        @{ type="MULTIPLE_CHOICE"; label="多选题"; count=10; score=20 },
        @{ type="TRUE_FALSE"; label="判断题"; count=10; score=10 },
        @{ type="FILL_BLANK"; label="填空题"; count=10; score=10 },
        @{ type="SHORT_ANSWER"; label="简答题"; count=4; score=20 },
        @{ type="PROGRAMMING"; label="编程题"; count=3; score=30 }
    )
}
$summary | ConvertTo-Json -Depth 20
