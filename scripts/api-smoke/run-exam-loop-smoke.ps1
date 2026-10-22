param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $PaperId = ""
)

$ErrorActionPreference = "Stop"

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) {
        throw "Smoke assertion failed: $Message"
    }
}

function Test-SubmittedLikeStatus([string] $Status) {
    return $Status -eq "SUBMITTED" -or $Status -eq "GRADING" -or $Status -eq "GRADED"
}
function Convert-ToIsoOffset([DateTimeOffset] $Value) {
    return $Value.ToString("yyyy-MM-ddTHH:mm:sszzz")
}

function Invoke-MindMarkApi {
    param(
        [Parameter(Mandatory = $true)] [string] $Method,
        [Parameter(Mandatory = $true)] [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{}
    )

    $uri = "$BaseUrl$Path"
    $params = @{
        Uri = $uri
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
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        if ($statusCode -eq 409 -or $_.Exception.Message -match "409") {
            return $true
        }
        throw
    }

    return $false
}

function Get-StudentDisplayChoiceAnswer {
    param(
        [object] $TeacherPaperQuestion,
        [object] $StudentPaperQuestion
    )

    $canonicalAnswer = $TeacherPaperQuestion.question.answer
    if (
        $TeacherPaperQuestion.question.type -ne "SINGLE_CHOICE" -and
        $TeacherPaperQuestion.question.type -ne "MULTIPLE_CHOICE"
    ) {
        return $canonicalAnswer
    }

    $canonicalOptions = @($TeacherPaperQuestion.question.options)
    $studentOptions = @($StudentPaperQuestion.question.options)
    $displayKeys = @()
    foreach ($canonicalKey in @($canonicalAnswer)) {
        $canonicalOption = @($canonicalOptions | Where-Object { $_.key -eq [string]$canonicalKey } | Select-Object -First 1)
        Assert-True ($canonicalOption.Count -eq 1) "canonical option exists for $canonicalKey"
        $studentOption = @($studentOptions | Where-Object { $_.content -eq $canonicalOption[0].content } | Select-Object -First 1)
        Assert-True ($studentOption.Count -eq 1) "student display option exists for canonical answer $canonicalKey"
        $displayKeys += [string]$studentOption[0].key
    }

    if ($TeacherPaperQuestion.question.type -eq "MULTIPLE_CHOICE") {
        return @($displayKeys)
    }
    return $displayKeys[0]
}

$summary = [ordered]@{}
$runId = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "[exam-smoke] BaseUrl=$BaseUrl runId=$runId"

$summary.actuator = (Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get -TimeoutSec 30).status
$summary.apiHealth = (Invoke-MindMarkApi GET "/api/v1/system/health").data.status

$teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $TeacherUsername
    password = $TeacherPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.token)" }
$summary.teacherLogin = $true

# Select the paper before creating the isolated class. An exam class must belong
# to the same course as the selected paper; otherwise the API correctly rejects
# the exam creation request with a 409 conflict.
$paper = $null
if ([string]::IsNullOrWhiteSpace($PaperId)) {
    $paperPage = (Invoke-MindMarkApi GET "/api/v1/papers?page=1&pageSize=100" $null $teacherHeaders).data
    $paperCandidates = @($paperPage.items) |
        Where-Object { ($_.status -eq "READY" -or $_.status -eq "PUBLISHED") -and ([decimal]$_.totalScore -eq 100) }

    foreach ($paperCandidate in $paperCandidates) {
        $candidatePaper = (Invoke-MindMarkApi GET "/api/v1/papers/$($paperCandidate.id)" $null $teacherHeaders).data
        $candidateTypes = @($candidatePaper.questions | ForEach-Object { $_.question.type })
        $hasSingleChoice = $candidateTypes -contains "SINGLE_CHOICE"
        $hasTrueFalse = $candidateTypes -contains "TRUE_FALSE"
        $hasSubjective = @($candidateTypes | Where-Object {
            $_ -eq "SHORT_ANSWER" -or $_ -eq "ESSAY" -or $_ -eq "PROGRAMMING"
        }).Count -gt 0

        if ($hasSingleChoice -and $hasTrueFalse -and $hasSubjective) {
            $PaperId = $paperCandidate.id
            $paper = $candidatePaper
            break
        }
    }

    Assert-True ($null -ne $paper) "a READY/PUBLISHED 100-point paper containing single-choice, true-false and subjective questions exists"
    Write-Host "[exam-smoke] auto-selected compatible 100-point paper id=$PaperId"
}

if ($null -eq $paper) {
    $paper = (Invoke-MindMarkApi GET "/api/v1/papers/$PaperId" $null $teacherHeaders).data
}
Assert-True ([decimal]$paper.totalScore -eq 100) "selected paper total score is 100"
Assert-True (-not [string]::IsNullOrWhiteSpace([string]$paper.courseId)) "selected paper has a course"
$summary.paperId = $PaperId
$summary.courseId = $paper.courseId

# Build an isolated one-student class under the selected paper's course so
# grading/publishing assertions stay deterministic and course ownership matches.
$class = (Invoke-MindMarkApi POST "/api/v1/admin/classes" @{
    courseId = $paper.courseId
    code = "SMOKE-CLS-$runId"
    name = "Smoke Class $runId"
    grade = "2026"
    major = "Software Engineering"
    status = "ACTIVE"
} $teacherHeaders).data
$summary.classId = $class.id

$studentNo = "202699$($runId.Substring(6))"
$initialPassword = $studentNo.Substring($studentNo.Length - 6)
$newPassword = "SmokePass$runId"
$import = (Invoke-MindMarkApi POST "/api/v1/classes/$($class.id)/students/import" @{
    className = $class.name
    students = @(
        @{
            studentNo = $studentNo
            name = "Smoke Student $runId"
            email = "$studentNo@student.mindmark.local"
            className = $class.name
            grade = "2026"
            major = "Software Engineering"
        }
    )
} $teacherHeaders).data
Assert-True ($import.createdCount -eq 1) "student import creates one account"
$summary.studentNo = $studentNo

$studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
    username = $studentNo
    password = $initialPassword
}).data
Assert-True (-not [string]::IsNullOrWhiteSpace($studentLogin.token)) "student token exists"
$studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
if ($studentLogin.mustChangePassword -eq $true) {
    $change = (Invoke-MindMarkApi POST "/api/v1/auth/change-password" @{
        oldPassword = $initialPassword
        newPassword = $newPassword
    } $studentHeaders).data
    Assert-True ($change.success -eq $true) "student password change succeeds"
    $studentLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
        username = $studentNo
        password = $newPassword
    }).data
    $studentHeaders = @{ Authorization = "Bearer $($studentLogin.token)" }
}
$summary.studentLogin = $true

$summary.paperStatusBefore = $paper.status
if ($paper.status -ne "READY" -and $paper.status -ne "PUBLISHED") {
    $paper = (Invoke-MindMarkApi PATCH "/api/v1/papers/$PaperId/status" @{ status = "READY" } $teacherHeaders).data
}
$summary.paperStatusAfter = $paper.status

$paperQuestionItems = @($paper.questions)
$singleChoiceItem = $paperQuestionItems |
    Where-Object { $_.question.type -eq "SINGLE_CHOICE" } |
    Select-Object -First 1
$trueFalseItem = $paperQuestionItems |
    Where-Object { $_.question.type -eq "TRUE_FALSE" } |
    Select-Object -First 1
$subjectiveItem = $paperQuestionItems |
    Where-Object { $_.question.type -eq "SHORT_ANSWER" -or $_.question.type -eq "ESSAY" -or $_.question.type -eq "PROGRAMMING" } |
    Select-Object -First 1
Assert-True ($null -ne $singleChoiceItem) "selected paper contains a single-choice question"
Assert-True ($null -ne $trueFalseItem) "selected paper contains a true-false question"
Assert-True ($null -ne $subjectiveItem) "selected paper contains a subjective question"
$singleQuestionId = $singleChoiceItem.questionId
$singleAnswer = $singleChoiceItem.question.answer
if ([string]::IsNullOrWhiteSpace([string]$singleAnswer)) { $singleAnswer = "A" }
$trueFalseQuestionId = $trueFalseItem.questionId
$trueFalseAnswer = $trueFalseItem.question.answer
if ([string]::IsNullOrWhiteSpace([string]$trueFalseAnswer)) { $trueFalseAnswer = "True" }
$subjectiveQuestionId = $subjectiveItem.questionId
$subjectiveMaxScore = [decimal]$subjectiveItem.score
Assert-True ($subjectiveMaxScore -gt 0) "subjective question max score is positive"
$itemReviewScore = $subjectiveMaxScore
$subjectiveAnswer = [string]$subjectiveItem.question.answer
if ([string]::IsNullOrWhiteSpace($subjectiveAnswer)) { $subjectiveAnswer = "已完成题目要求，并给出关键步骤与结论。" }
$summary.paperQuestionCount = $paperQuestionItems.Count
$summary.paperQuestionTypes = @($paperQuestionItems | ForEach-Object { $_.question.type } | Sort-Object -Unique)

# Scenario A0: scheduled exam cannot be answered before startAt; the server is the final time-window judge.
$futureNow = [DateTimeOffset]::Now
$scheduledExam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Round 2 Scheduled Window Guard Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($futureNow.AddMinutes(10))
    endAt = Convert-ToIsoOffset($futureNow.AddMinutes(20))
    durationMinutes = 5
} $teacherHeaders).data
Assert-True ($scheduledExam.status -eq "SCHEDULED") "scheduled exam remains SCHEDULED before startAt"
$scheduledStudentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $scheduledExam.id } | Select-Object -First 1)
Assert-True ($null -ne $scheduledStudentExam) "scheduled exam appears in student list"
$preStartDraftConflict = Invoke-MindMarkApiExpectConflict PUT "/api/v1/answer-sheets/$($scheduledStudentExam.answerSheetId)/draft" @{
    answers = @(@{ questionId = $singleQuestionId; answer = $singleAnswer })
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders
Assert-True $preStartDraftConflict "draft save before startAt returns conflict"
$preStartSubmitConflict = Invoke-MindMarkApiExpectConflict POST "/api/v1/answer-sheets/$($scheduledStudentExam.answerSheetId)/submit" $null $studentHeaders
Assert-True $preStartSubmitConflict "submit before startAt returns conflict"
$summary.scheduledWindowGuardChecked = $true

# Scenario A: normal exam closed-loop: create -> student draft -> security audit -> version conflict -> submit idempotently -> grade -> publish -> report.
$normalNow = [DateTimeOffset]::Now
$normalExam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Round 3 Closed Loop Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($normalNow.AddMinutes(-1))
    endAt = Convert-ToIsoOffset($normalNow.AddMinutes(5))
    durationMinutes = 5
} $teacherHeaders).data
Assert-True ($normalExam.status -eq "ONGOING") "normal exam is ongoing"
$summary.closedLoopExamId = $normalExam.id

$studentExams = (Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data
$studentExam = $studentExams | Where-Object { $_.id -eq $normalExam.id } | Select-Object -First 1
Assert-True ($null -ne $studentExam) "created exam appears in student list"
Assert-True ($studentExam.answerStatus -eq "NOT_STARTED") "student exam initially not started"
$answerSheetId = $studentExam.answerSheetId

$studentPaper = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($normalExam.id)/paper" $null $studentHeaders).data
$studentPaperAfterRefresh = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($normalExam.id)/paper" $null $studentHeaders).data
$studentSingleChoiceItem = @($studentPaper.questions | Where-Object { $_.questionId -eq $singleQuestionId } | Select-Object -First 1)
$studentSingleChoiceItemAfterRefresh = @($studentPaperAfterRefresh.questions | Where-Object { $_.questionId -eq $singleQuestionId } | Select-Object -First 1)
Assert-True ($studentSingleChoiceItem.Count -eq 1) "student randomized paper contains selected single-choice question"
Assert-True ($studentSingleChoiceItemAfterRefresh.Count -eq 1) "student randomized paper remains available after refresh"
$firstStudentOptionOrder = @(
    $studentSingleChoiceItem[0].question.options |
        ForEach-Object { "$($_.key):$($_.content)" }
) -join "|"
$secondStudentOptionOrder = @(
    $studentSingleChoiceItemAfterRefresh[0].question.options |
        ForEach-Object { "$($_.key):$($_.content)" }
) -join "|"
Assert-True ($firstStudentOptionOrder -eq $secondStudentOptionOrder) "student option order remains stable after refresh"
$studentSingleAnswer = Get-StudentDisplayChoiceAnswer $singleChoiceItem $studentSingleChoiceItem[0]
$summary.randomizedSingleChoiceAnswerMapped = $true

$answerSheet = (Invoke-MindMarkApi GET "/api/v1/answer-sheets/by-exam/$($normalExam.id)" $null $studentHeaders).data
Assert-True ($answerSheet.id -eq $answerSheetId) "answer sheet by exam matches student list"
$summary.answerSheetId = $answerSheetId

$draft = (Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$answerSheetId/draft" @{
    answers = @(
        @{ questionId = $singleQuestionId; answer = $studentSingleAnswer },
        @{ questionId = $trueFalseQuestionId; answer = $trueFalseAnswer },
        @{ questionId = $subjectiveQuestionId; answer = $subjectiveAnswer }
    )
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders).data
Assert-True ($draft.version -eq 1) "draft version increments to 1"
$summary.draftVersion = $draft.version

$securityEvent = (Invoke-MindMarkApi POST "/api/v1/exams/$($normalExam.id)/security-events" @{
    eventType = "WINDOW_BLUR"
    message = "Smoke window blur during exam."
    clientEventCount = 1
    clientOccurredAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
} $studentHeaders).data
Assert-True ($securityEvent.examId -eq $normalExam.id) "security event binds to exam"
Assert-True ($securityEvent.severity -eq "MEDIUM") "window blur event severity is MEDIUM"
$securityEventsPage = (Invoke-MindMarkApi GET "/api/v1/exams/$($normalExam.id)/security-events?page=1&pageSize=20" $null $teacherHeaders).data
Assert-True (($securityEventsPage.items | Where-Object { $_.id -eq $securityEvent.id } | Select-Object -First 1) -ne $null) "teacher can query reported security event"
$summary.securityAuditEventId = $securityEvent.id

$conflict = Invoke-MindMarkApiExpectConflict PUT "/api/v1/answer-sheets/$answerSheetId/draft" @{
    answers = @(@{ questionId = $singleQuestionId; answer = $studentSingleAnswer })
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders
Assert-True $conflict "stale expectedVersion returns 409 conflict"
$summary.versionConflictChecked = $true

$submitted = (Invoke-MindMarkApi POST "/api/v1/answer-sheets/$answerSheetId/submit" $null $studentHeaders).data
Assert-True (Test-SubmittedLikeStatus $submitted.status) "answer sheet submitted or entered grading"
$submittedAgain = (Invoke-MindMarkApi POST "/api/v1/answer-sheets/$answerSheetId/submit" $null $studentHeaders).data
Assert-True (Test-SubmittedLikeStatus $submittedAgain.status) "submit is idempotent after submission/grading"
$summary.answerSheetStatusAfterSubmit = $submittedAgain.status

$gradingTaskId = "GT-$answerSheetId"
$gradingTasks = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?examId=$($normalExam.id)" $null $teacherHeaders).data
Assert-True (($gradingTasks | Where-Object { $_.id -eq $gradingTaskId } | Select-Object -First 1) -ne $null) "grading task generated"

$autoGraded = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$gradingTaskId/auto-grade" $null $teacherHeaders).data
$summary.gradingStatusAfterAuto = $autoGraded.status
$itemReviewed = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$gradingTaskId/items/$subjectiveQuestionId/review" @{
    finalScore = $itemReviewScore
    comment = "Manual item review smoke."
} $teacherHeaders).data
$summary.itemReviewStatus = $itemReviewed.status
$taskReviewed = (Invoke-MindMarkApi POST "/api/v1/grading-tasks/$gradingTaskId/review" @{
    finalScore = 12
    comment = "Runtime smoke review completed."
} $teacherHeaders).data
Assert-True ($taskReviewed.status -eq "REVIEWED") "grading task reviewed"
$summary.gradingStatusAfterReview = $taskReviewed.status

$scoreSummary = (Invoke-MindMarkApi GET "/api/v1/exams/$($normalExam.id)/scores" $null $teacherHeaders).data
Assert-True ($scoreSummary.items.Count -ge 1) "score summary has reviewed item"
$published = (Invoke-MindMarkApi POST "/api/v1/exams/$($normalExam.id)/publish-scores" $null $teacherHeaders).data
Assert-True ($published.publishedCount -eq 1) "one score report published"
$summary.publishedCount = $published.publishedCount

$reports = (Invoke-MindMarkApi GET "/api/v1/student/score-reports" $null $studentHeaders).data
Assert-True (($reports | Where-Object { $_.examId -eq $normalExam.id } | Select-Object -First 1) -ne $null) "student score report found"
$summary.studentReportFound = $true

$reviewReport = (Invoke-MindMarkApi GET "/api/v1/exams/$($normalExam.id)/review" $null $teacherHeaders).data
Assert-True ($reviewReport.examId -eq $normalExam.id) "review report matches exam"
Assert-True ($reviewReport.questionPerformances.Count -ge 1) "review report has question performance"
Assert-True ($reviewReport.lectureDraft.content.Length -gt 0) "review report has AI lecture draft"
$summary.reviewReportFound = $true
$summary.reviewDraftStatus = $reviewReport.lectureDraft.status

$regeneratedDraft = (Invoke-MindMarkApi POST "/api/v1/exams/$($normalExam.id)/lecture-draft/regenerate" $null $teacherHeaders).data
Assert-True ($regeneratedDraft.status -eq "REVIEWING") "lecture draft regenerated"
$approvedDraft = (Invoke-MindMarkApi POST "/api/v1/exams/$($normalExam.id)/lecture-draft/approve" @{
    teacherEditedContent = "Smoke approved lecture draft."
} $teacherHeaders).data
Assert-True ($approvedDraft.status -eq "APPROVED") "lecture draft approved"
$summary.approvedDraftStatus = $approvedDraft.status

$reviewArtifact = (Invoke-MindMarkApi POST "/api/v1/exams/$($normalExam.id)/review-artifacts" @{
    artifactType = "REVIEW_REPORT_MARKDOWN"
} $teacherHeaders).data
Assert-True (-not [string]::IsNullOrWhiteSpace($reviewArtifact.objectKey)) "review artifact uploaded"
Assert-True (-not [string]::IsNullOrWhiteSpace($reviewArtifact.downloadUrl)) "review artifact download url exists"
$summary.reviewArtifactId = $reviewArtifact.id

# Scenario A2: AI question review smoke runs when pending AI drafts already exist in the environment.
$pendingAiQuestions = (Invoke-MindMarkApi GET "/api/v1/questions?source=AI&status=PENDING_REVIEW&page=1&pageSize=1" $null $teacherHeaders).data.items
if ($pendingAiQuestions.Count -gt 0) {
    $pendingAiQuestion = $pendingAiQuestions | Select-Object -First 1
    $reviewedAiQuestion = (Invoke-MindMarkApi POST "/api/v1/questions/$($pendingAiQuestion.id)/review" @{
        action = "ACCEPTED"
        comment = "Smoke accepted AI generated question."
    } $teacherHeaders).data
    Assert-True ($reviewedAiQuestion.status -eq "ACTIVE") "AI question review promotes question to ACTIVE"
    Assert-True ($reviewedAiQuestion.reviewAction -eq "ACCEPTED") "AI question review action is persisted"
    $summary.aiQuestionReviewChecked = $true
    $summary.aiQuestionReviewedId = $reviewedAiQuestion.id
} else {
    Write-Host "[exam-smoke] skip AI question review assertion: no PENDING_REVIEW AI question exists."
    $summary.aiQuestionReviewChecked = $false
}

# Scenario B: timeout with saved draft auto-submits and generates grading task.
$timeoutNow = [DateTimeOffset]::Now
$timeoutExam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Round 3 Timeout Auto Submit Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($timeoutNow.AddSeconds(-90))
    endAt = Convert-ToIsoOffset($timeoutNow.AddSeconds(20))
    durationMinutes = 1
} $teacherHeaders).data
Assert-True ($timeoutExam.status -eq "ONGOING") "timeout exam starts ongoing"
$timeoutStudentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $timeoutExam.id } | Select-Object -First 1)
Assert-True ($null -ne $timeoutStudentExam) "timeout exam appears in student list"
$timeoutSheetId = $timeoutStudentExam.answerSheetId
$timeoutStudentPaper = (Invoke-MindMarkApi GET "/api/v1/student/exams/$($timeoutExam.id)/paper" $null $studentHeaders).data
$timeoutStudentSingleChoiceItem = @($timeoutStudentPaper.questions | Where-Object { $_.questionId -eq $singleQuestionId } | Select-Object -First 1)
Assert-True ($timeoutStudentSingleChoiceItem.Count -eq 1) "timeout student paper contains selected single-choice question"
$timeoutStudentSingleAnswer = Get-StudentDisplayChoiceAnswer $singleChoiceItem $timeoutStudentSingleChoiceItem[0]

$timeoutDraft = (Invoke-MindMarkApi PUT "/api/v1/answer-sheets/$timeoutSheetId/draft" @{
    answers = @(
        @{ questionId = $singleQuestionId; answer = $timeoutStudentSingleAnswer },
        @{ questionId = $trueFalseQuestionId; answer = $trueFalseAnswer }
    )
    clientSavedAt = Convert-ToIsoOffset([DateTimeOffset]::Now)
    expectedVersion = 0
} $studentHeaders).data
Assert-True ($timeoutDraft.version -eq 1) "timeout exam draft saved"
Write-Host "[exam-smoke] waiting for timeout auto-submit window..."
Start-Sleep -Seconds 25
$timeoutSheet = (Invoke-MindMarkApi GET "/api/v1/answer-sheets/$timeoutSheetId" $null $studentHeaders).data
Assert-True (Test-SubmittedLikeStatus $timeoutSheet.status) "saved draft auto-submitted after endAt and entered submission/grading flow"
$timeoutTasks = (Invoke-MindMarkApi GET "/api/v1/grading-tasks?examId=$($timeoutExam.id)" $null $teacherHeaders).data
Assert-True (($timeoutTasks | Where-Object { $_.answerSheetId -eq $timeoutSheetId -or $_.id -eq "GT-$timeoutSheetId" } | Select-Object -First 1) -ne $null) "timeout auto-submit generated grading task"
$summary.timeoutExamId = $timeoutExam.id
$summary.timeoutAnswerStatus = $timeoutSheet.status

# Scenario C: ended exam with no draft is marked ABSENT on student read.
$absentNow = [DateTimeOffset]::Now
$absentExam = (Invoke-MindMarkApi POST "/api/v1/exams" @{
    title = "Round 3 Absent Smoke $runId"
    paperId = $PaperId
    classIds = @($class.id)
    startAt = Convert-ToIsoOffset($absentNow.AddMinutes(-3))
    endAt = Convert-ToIsoOffset($absentNow.AddMinutes(-1))
    durationMinutes = 1
} $teacherHeaders).data
Assert-True ($absentExam.status -eq "ENDED") "absent exam is created ended"
$absentStudentExam = ((Invoke-MindMarkApi GET "/api/v1/student/exams" $null $studentHeaders).data | Where-Object { $_.id -eq $absentExam.id } | Select-Object -First 1)
Assert-True ($null -ne $absentStudentExam) "absent exam appears in student list"
Assert-True ($absentStudentExam.answerStatus -eq "ABSENT") "student answer status becomes ABSENT"
$absentSheet = (Invoke-MindMarkApi GET "/api/v1/answer-sheets/$($absentStudentExam.answerSheetId)" $null $studentHeaders).data
Assert-True ($absentSheet.status -eq "ABSENT") "answer sheet status becomes ABSENT"
$summary.absentExamId = $absentExam.id
$summary.absentAnswerStatus = $absentSheet.status

Write-Host "MindMark exam closed-loop + timeout smoke passed." -ForegroundColor Green
$summary | ConvertTo-Json -Depth 30
