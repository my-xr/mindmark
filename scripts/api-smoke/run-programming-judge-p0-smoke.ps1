param(
    [string] $BaseUrl = "http://localhost:8080",
    [string] $TeacherUsername = "teacher@mindmark.local",
    [string] $TeacherPassword = "dev-password",
    [string] $CourseId = "course-frontend-001"
)

$ErrorActionPreference = "Stop"

function Invoke-MindMarkApi {
    param(
        [ValidateSet("GET", "POST", "PUT", "DELETE")]
        [string] $Method,
        [string] $Path,
        [object] $Body = $null,
        [hashtable] $Headers = @{}
    )

    $uri = "$BaseUrl$Path"
    $invokeArgs = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
        TimeoutSec = 30
    }
    if ($null -ne $Body) {
        $invokeArgs.ContentType = "application/json; charset=utf-8"
        $invokeArgs.Body = ($Body | ConvertTo-Json -Depth 40)
    }
    return Invoke-RestMethod @invokeArgs
}

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) {
        throw "ASSERT FAILED: $Message"
    }
    Write-Host "[OK] $Message" -ForegroundColor Green
}

$summary = [ordered]@{}
$runId = Get-Date -Format "yyyyMMddHHmmss"
$createdQuestionId = $null
$headers = @{}

try {
    Write-Host "[programming-judge-p0-smoke] BaseUrl=$BaseUrl runId=$runId"

    $health = (Invoke-MindMarkApi GET "/api/v1/system/health").data
    Assert-True ($health.status -eq "UP") "API health is UP"
    $summary.apiHealth = $health.status

    $teacherLogin = (Invoke-MindMarkApi POST "/api/v1/auth/login" @{
        username = $TeacherUsername
        password = $TeacherPassword
    }).data
    Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.token)) "teacher token exists"
    $headers = @{ Authorization = "Bearer $($teacherLogin.token)" }
    $summary.teacherLogin = $true

    $questionTitle = "Smoke Programming OJ P0 Contract $runId"
    $questionBody = @{
        courseId = $CourseId
        title = $questionTitle
        type = "PROGRAMMING"
        difficulty = "MEDIUM"
        knowledgePoints = @("OJ P0", "Sandbox Contract")
        score = 10
        answer = "Judged by OJ/Sandbox test cases. P0 only persists queued judge contracts."
        analysis = "Smoke verifies programming test case persistence, pagination, update, delete, and no code execution in main backend."
        options = @()
        scoringPoints = @(
            @{ label = "Public case"; score = 5 },
            @{ label = "Hidden case"; score = 5 }
        )
    }
    $createdQuestion = (Invoke-MindMarkApi POST "/api/v1/questions" $questionBody $headers).data
    Assert-True ($createdQuestion.type -eq "PROGRAMMING") "programming question created"
    Assert-True ($createdQuestion.title -eq $questionTitle) "programming question title persists"
    $createdQuestionId = $createdQuestion.id
    $summary.questionId = $createdQuestionId

    $publicCase = (Invoke-MindMarkApi POST "/api/v1/questions/$createdQuestionId/programming-test-cases" @{
        title = "Public sample: sum"
        inputPayload = "2 3"
        expectedOutput = "5"
        visibility = "PUBLIC"
        weight = 5
        sortOrder = 1
    } $headers).data
    Assert-True ($publicCase.visibility -eq "PUBLIC") "public test case created"

    $hiddenCase = (Invoke-MindMarkApi POST "/api/v1/questions/$createdQuestionId/programming-test-cases" @{
        title = "Hidden case: boundary"
        inputPayload = "-1 1"
        expectedOutput = "0"
        visibility = "HIDDEN"
        weight = 5
        sortOrder = 2
    } $headers).data
    Assert-True ($hiddenCase.visibility -eq "HIDDEN") "hidden test case created"

    $casePage = (Invoke-MindMarkApi GET "/api/v1/questions/$createdQuestionId/programming-test-cases?page=1&pageSize=10" $null $headers).data
    Assert-True ($casePage.total -ge 2) "test case pagination lists created cases"
    Assert-True (($casePage.items | Where-Object { $_.id -eq $publicCase.id } | Select-Object -First 1) -ne $null) "public case appears in paged list"
    Assert-True (($casePage.items | Where-Object { $_.id -eq $hiddenCase.id } | Select-Object -First 1) -ne $null) "hidden case appears in teacher paged list"

    $updatedPublicCase = (Invoke-MindMarkApi PUT "/api/v1/programming-test-cases/$($publicCase.id)" @{
        title = "Public sample: sum - updated"
        inputPayload = "10 15"
        expectedOutput = "25"
        visibility = "PUBLIC"
        weight = 6
        sortOrder = 1
    } $headers).data
    Assert-True ($updatedPublicCase.title -like "*updated") "test case update works"
    Assert-True ([decimal]$updatedPublicCase.weight -eq 6) "test case weight update works"

    $deletedHiddenCase = (Invoke-MindMarkApi DELETE "/api/v1/programming-test-cases/$($hiddenCase.id)" $null $headers).data
    Assert-True ($deletedHiddenCase.id -eq $hiddenCase.id) "test case delete works"

    $casePageAfterDelete = (Invoke-MindMarkApi GET "/api/v1/questions/$createdQuestionId/programming-test-cases?page=1&pageSize=10" $null $headers).data
    Assert-True (($casePageAfterDelete.items | Where-Object { $_.id -eq $hiddenCase.id } | Select-Object -First 1) -eq $null) "deleted case no longer appears"

    $summary.testCaseCreateUpdateDelete = $true
    Write-Host "MindMark programming OJ/Sandbox P0 smoke passed." -ForegroundColor Green
    $summary | ConvertTo-Json -Depth 40
} finally {
    if (-not [string]::IsNullOrWhiteSpace($createdQuestionId) -and $headers.Count -gt 0) {
        try {
            [void](Invoke-MindMarkApi DELETE "/api/v1/questions/$createdQuestionId" $null $headers)
            Write-Host "[cleanup] deleted programming smoke question $createdQuestionId"
        } catch {
            Write-Warning "[cleanup] failed to delete programming smoke question ${createdQuestionId}: $($_.Exception.Message)"
        }
    }
}