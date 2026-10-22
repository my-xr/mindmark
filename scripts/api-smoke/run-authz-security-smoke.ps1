param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$TeacherUsername = "teacher@mindmark.local",
    [string]$TeacherPassword = "dev-password",
    [string]$StudentUsername = "20260722120655",
    [string]$StudentPassword = "Mindmark123",
    [string]$TaUsername = "",
    [string]$TaPassword = "",
    [string]$AssignedCourseId = "",
    [string]$OutOfScopeCourseId = "",
    [switch]$RequireIndependentRoles
)

$ErrorActionPreference = "Stop"

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) {
        throw "Authorization smoke assertion failed: $Message"
    }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)] [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")] [string]$Method,
        [Parameter(Mandatory = $true)] [string]$Path,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [switch]$AllowBusinessFailure
    )

    $uri = "$BaseUrl$Path"
    $jsonBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 20 } else { $null }
    $hasHeaders = $null -ne $Headers -and $Headers.Count -gt 0

    try {
        if ($null -ne $jsonBody -and $hasHeaders) {
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -Headers $Headers `
                -ContentType "application/json; charset=utf-8" -Body $jsonBody -TimeoutSec 30
        } elseif ($null -ne $jsonBody) {
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri `
                -ContentType "application/json; charset=utf-8" -Body $jsonBody -TimeoutSec 30
        } elseif ($hasHeaders) {
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -Headers $Headers -TimeoutSec 30
        } else {
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -TimeoutSec 30
        }
        $status = [int]$response.StatusCode
        $payload = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        $payload = $null
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Dispose()
                if ($content) {
                    $payload = $content | ConvertFrom-Json
                }
            } catch {
                # The status code is still enough for the boundary assertion.
            }
        }
    }

    Assert-True ($status -eq $ExpectedStatus) "$Method $Path expected HTTP $ExpectedStatus but received $status"
    if (-not $AllowBusinessFailure -and $null -ne $payload -and ($payload.PSObject.Properties.Name -contains "code")) {
        Assert-True ($payload.code -eq "0") "$Method $Path returned $($payload.code): $($payload.message)"
    }
    return $payload
}

function Login([string]$Username, [string]$Password) {
    $response = Invoke-Api POST "/api/v1/auth/login" -Body @{
        username = $Username
        password = $Password
    }
    Assert-True ($null -ne $response.data.token) "token returned for $Username"
    return @{
        Token = $response.data.token
        Headers = @{ Authorization = "Bearer $($response.data.token)" }
    }
}

function Assert-IndependentRole([hashtable]$Session, [string]$Role, [string]$Label) {
    $me = Invoke-Api GET "/api/v1/auth/me" -Headers $Session.Headers
    $roles = @($me.data.roles | ForEach-Object { [string]$_ })
    Assert-True ($roles.Count -eq 1 -and $roles[0] -eq $Role) "$Label must have only the $Role role; actual roles=$($roles -join ',')"
}

function Assert-CourseScope([hashtable]$Session, [string]$Label) {
    if ([string]::IsNullOrWhiteSpace($AssignedCourseId) -or [string]::IsNullOrWhiteSpace($OutOfScopeCourseId)) {
        return
    }
    Invoke-Api GET "/api/v1/courses/$AssignedCourseId/chapters" -Headers $Session.Headers | Out-Null
    Invoke-Api GET "/api/v1/courses/$OutOfScopeCourseId/chapters" -Headers $Session.Headers -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
    Write-Host "[authz-smoke] $Label assigned/out-of-scope course boundary is enforced"
}

function Get-ChoiceOptionFingerprint([object]$Paper) {
    $parts = @(
        @($Paper.questions) |
            Where-Object {
                $_.question.type -eq "SINGLE_CHOICE" -or $_.question.type -eq "MULTIPLE_CHOICE"
            } |
            ForEach-Object {
                $options = @($_.question.options | ForEach-Object { "$($_.key):$($_.content)" }) -join "|"
                "$($_.questionId)=$options"
            }
    )
    return $parts -join "||"
}

Write-Host "[authz-smoke] BaseUrl=$BaseUrl"

if ($RequireIndependentRoles -and ([string]::IsNullOrWhiteSpace($TaUsername) -or [string]::IsNullOrWhiteSpace($TaPassword))) {
    throw "-RequireIndependentRoles requires -TaUsername and -TaPassword"
}
if ($RequireIndependentRoles -and ([string]::IsNullOrWhiteSpace($AssignedCourseId) -or [string]::IsNullOrWhiteSpace($OutOfScopeCourseId))) {
    throw "-RequireIndependentRoles requires -AssignedCourseId and -OutOfScopeCourseId"
}

# A spoofed identity header must never create an authenticated session.
$spoofed = @{
    "X-MindMark-User-Id" = "admin"
    "X-MindMark-Roles" = "ADMIN"
}
Invoke-Api GET "/api/v1/auth/me" -Headers $spoofed -ExpectedStatus 401 -AllowBusinessFailure | Out-Null
Write-Host "[authz-smoke] unauthenticated and spoofed-header requests are rejected"

$teacher = Login $TeacherUsername $TeacherPassword
$student = Login $StudentUsername $StudentPassword
$ta = $null
if (-not [string]::IsNullOrWhiteSpace($TaUsername) -or -not [string]::IsNullOrWhiteSpace($TaPassword)) {
    if ([string]::IsNullOrWhiteSpace($TaUsername) -or [string]::IsNullOrWhiteSpace($TaPassword)) {
        throw "-TaUsername and -TaPassword must be supplied together"
    }
    $ta = Login $TaUsername $TaPassword
}

$teacherHeaders = $teacher.Headers
$studentHeaders = $student.Headers

if ($RequireIndependentRoles) {
    Assert-IndependentRole $teacher "TEACHER" "teacher account"
    Assert-IndependentRole $ta "TA" "TA account"
    Assert-IndependentRole $student "STUDENT" "student account"
    Invoke-Api GET "/api/v1/admin/users?page=1&pageSize=1" -Headers $ta.Headers -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
    Assert-CourseScope $teacher "teacher"
    Assert-CourseScope $ta "TA"
    Write-Host "[authz-smoke] independent TEACHER/TA/STUDENT role profiles verified"
} elseif ($null -ne $ta) {
    Assert-CourseScope $ta "TA"
}
Assert-CourseScope $teacher "teacher"

$paperPage = Invoke-Api GET "/api/v1/papers?page=1&pageSize=20" -Headers $teacherHeaders
$examPage = Invoke-Api GET "/api/v1/exams?page=1&pageSize=20" -Headers $teacherHeaders
$questionPage = Invoke-Api GET "/api/v1/questions?page=1&pageSize=20" -Headers $teacherHeaders
Invoke-Api GET "/api/v1/score-summaries?page=1&pageSize=20" -Headers $teacherHeaders | Out-Null
Write-Host "[authz-smoke] staff resources are available to teacher/admin role"

# A student must not see teacher-side resource collections, staff workflows,
# provider configuration or downloadable roster data.
@(
    "/api/v1/questions?page=1&pageSize=20",
    "/api/v1/papers?page=1&pageSize=20",
    "/api/v1/exams?page=1&pageSize=20",
    "/api/v1/score-summaries?page=1&pageSize=20",
    "/api/v1/grading-tasks?page=1&pageSize=20",
    "/api/v1/exams/reviews?page=1&pageSize=20",
    "/api/v1/teacher/dashboard",
    "/api/v1/ai/provider-settings?provider=OPENAI",
    "/api/v1/student-roster-template"
) | ForEach-Object {
    Invoke-Api GET $_ -Headers $studentHeaders -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
}
Write-Host "[authz-smoke] student cannot access teacher-side collections"

# A teacher must not enter student-only resources through a guessed URL.
@(
    "/api/v1/student/exams",
    "/api/v1/student/score-reports"
) | ForEach-Object {
    Invoke-Api GET $_ -Headers $teacherHeaders -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
}
Write-Host "[authz-smoke] teacher cannot access student-only collections"

$teacherExam = @($examPage.data.items) | Select-Object -First 1
if ($null -ne $teacherExam) {
    Invoke-Api GET "/api/v1/exams/$($teacherExam.id)/security-events?page=1&pageSize=20" `
        -Headers $studentHeaders -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
    Write-Host "[authz-smoke] student cannot read teacher security audit events"
} else {
    Write-Host "[authz-smoke] no teacher exam found; security audit boundary assertion skipped" -ForegroundColor Yellow
}

# Students must not bypass the answer-sheet-specific randomized option order
# through staff paper endpoints. Assigned-exam delivery is the only valid path.
$studentExams = Invoke-Api GET "/api/v1/student/exams" -Headers $studentHeaders
$studentExam = @($studentExams.data) | Select-Object -First 1
if ($null -ne $studentExam) {
    $studentExamDetail = Invoke-Api GET "/api/v1/exams/$($studentExam.id)" -Headers $studentHeaders
    Assert-True ($null -ne $studentExamDetail.data) "student exam detail is available"

    @(
        "/api/v1/papers/$($studentExam.paperId)",
        "/api/v1/papers/$($studentExam.paperId)/questions?page=1&pageSize=20",
        "/api/v1/papers/$($studentExam.paperId)/answer-key"
    ) | ForEach-Object {
        Invoke-Api GET $_ -Headers $studentHeaders -ExpectedStatus 403 -AllowBusinessFailure | Out-Null
    }
    Write-Host "[authz-smoke] student cannot bypass assigned-exam paper delivery"

    $ongoingStudentExam = @($studentExams.data) | Where-Object { $_.status -eq "ONGOING" } | Select-Object -First 1
    if ($null -ne $ongoingStudentExam) {
        $firstPaper = Invoke-Api GET "/api/v1/student/exams/$($ongoingStudentExam.id)/paper" -Headers $studentHeaders
        $secondPaper = Invoke-Api GET "/api/v1/student/exams/$($ongoingStudentExam.id)/paper" -Headers $studentHeaders
        Assert-True (
            (Get-ChoiceOptionFingerprint $firstPaper.data) -eq (Get-ChoiceOptionFingerprint $secondPaper.data)
        ) "student randomized option order stays stable after refresh"

        foreach ($paperQuestion in @($firstPaper.data.questions)) {
            $question = $paperQuestion.question
            Assert-True ($null -eq $question.answer) "student paper question answer is redacted"
            Assert-True ($null -eq $question.analysis) "student paper question analysis is redacted"
            Assert-True ($null -eq $question.scoringPoints) "student paper question scoring points are redacted"
        }
        Write-Host "[authz-smoke] student randomized paper is stable and answer metadata is redacted"
    } else {
        Write-Host "[authz-smoke] no ongoing student exam found; randomized-payload assertion skipped" -ForegroundColor Yellow
    }
} else {
    Write-Host "[authz-smoke] no student exam found; student paper boundary assertion skipped" -ForegroundColor Yellow
}

Write-Host "[authz-smoke] PASS" -ForegroundColor Green
