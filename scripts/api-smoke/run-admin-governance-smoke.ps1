param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [string]$AdminUsername = "teacher@mindmark.local",
    [string]$AdminPassword = "dev-password",
    [string]$TargetUserId = "",
    [string]$TeacherUserId = "",
    [string]$ClassId = ""
)

$ErrorActionPreference = "Stop"

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) {
        throw "Smoke assertion failed: $Message"
    }
}

function Invoke-Json([string]$Method, [string]$Uri, [object]$Body = $null, [hashtable]$Headers = @{}) {
    $parameters = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
        ContentType = "application/json; charset=utf-8"
    }
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 12
        $parameters.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }
    Invoke-RestMethod @parameters
}

function First-Item($Value) {
    if ($null -eq $Value) { return $null }
    if ($Value -is [System.Array]) { return $Value | Select-Object -First 1 }
    return $Value
}

Write-Host "[admin-governance-smoke] BaseUrl=$BaseUrl"

$login = Invoke-Json "Post" "$BaseUrl/auth/login" @{ username = $AdminUsername; password = $AdminPassword }
Assert-True ($login.code -eq "0") "admin login code"
Assert-True (-not [string]::IsNullOrWhiteSpace($login.data.token)) "admin token exists"
$headers = @{ Authorization = "Bearer $($login.data.token)" }
Write-Host "[admin-governance-smoke] admin login ok"

$users = Invoke-Json "Get" "$BaseUrl/admin/users?page=1&pageSize=50" $null $headers
Assert-True ($users.code -eq "0") "list users code"
Assert-True ($users.data.total -ge 1) "users total >= 1"
Write-Host "[admin-governance-smoke] list users ok total=$($users.data.total)"

if ([string]::IsNullOrWhiteSpace($TeacherUserId)) {
    $teacher = First-Item ($users.data.items | Where-Object { $_.roles -contains "TEACHER" })
    Assert-True ($null -ne $teacher) "a teacher user exists"
    $TeacherUserId = $teacher.id
}
if ([string]::IsNullOrWhiteSpace($TargetUserId)) {
    $student = First-Item ($users.data.items | Where-Object { $_.roles -contains "STUDENT" -and $_.id -ne $TeacherUserId })
    Assert-True ($null -ne $student) "a student target user exists"
    $TargetUserId = $student.id
}
if ([string]::IsNullOrWhiteSpace($ClassId)) {
    $classes = Invoke-Json "Get" "$BaseUrl/admin/classes" $null $headers
    Assert-True ($classes.code -eq "0") "list admin classes code"
    $class = First-Item $classes.data
    Assert-True ($null -ne $class) "an active class exists"
    $ClassId = $class.id
}
Write-Host "[admin-governance-smoke] targetUserId=$TargetUserId teacherUserId=$TeacherUserId classId=$ClassId"

$assignment = Invoke-Json "Post" "$BaseUrl/admin/users/$TeacherUserId/class-assignments" @{ classId = $ClassId; assignmentRole = "ASSISTANT" } $headers
Assert-True ($assignment.code -eq "0") "upsert assignment code"
Assert-True ($assignment.data.classId -eq $ClassId) "assignment classId"
Write-Host "[admin-governance-smoke] upsert class assignment ok"

$assignments = Invoke-Json "Get" "$BaseUrl/admin/users/$TeacherUserId/class-assignments" $null $headers
$matchedAssignment = $assignments.data | Where-Object { $_.classId -eq $ClassId } | Select-Object -First 1
Assert-True ($null -ne $matchedAssignment) "assignment exists"
Write-Host "[admin-governance-smoke] list class assignments ok"

$disabled = Invoke-Json "Patch" "$BaseUrl/admin/users/$TargetUserId/status" @{ status = "DISABLED" } $headers
Assert-True ($disabled.data.status -eq "DISABLED") "disable target user"
$enabled = Invoke-Json "Patch" "$BaseUrl/admin/users/$TargetUserId/status" @{ status = "ACTIVE" } $headers
Assert-True ($enabled.data.status -eq "ACTIVE") "restore target user"
Write-Host "[admin-governance-smoke] disable and restore target user ok"

$unlocked = Invoke-Json "Post" "$BaseUrl/admin/users/$TargetUserId/unlock" @{} $headers
Assert-True ($unlocked.data.failedLoginCount -eq 0) "unlock clears failed count"
Write-Host "[admin-governance-smoke] unlock target user ok"

$audit = Invoke-Json "Get" "$BaseUrl/admin/audit-logs?action=ADMIN_&page=1&pageSize=20" $null $headers
Assert-True ($audit.code -eq "0") "audit query code"
Assert-True ($audit.data.total -ge 1) "audit total >= 1"
Write-Host "[admin-governance-smoke] audit query ok total=$($audit.data.total)"

Write-Host "[admin-governance-smoke] PASS"