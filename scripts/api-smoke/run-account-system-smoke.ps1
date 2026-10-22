param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [string]$TeacherUsername = "teacher@mindmark.local",
    [string]$TeacherPassword = "dev-password",
    [string]$ClassId = "",
    [string]$ClassName = ""
)

$ErrorActionPreference = "Stop"

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) {
        throw "Smoke assertion failed: $Message"
    }
}

function Post-Json([string]$Uri, [object]$Body, [hashtable]$Headers = @{}) {
    $jsonBody = $Body | ConvertTo-Json -Depth 8
    Invoke-RestMethod -Method Post -Uri $Uri -ContentType "application/json; charset=utf-8" -Headers $Headers -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody))
}

Write-Host "[account-smoke] BaseUrl=$BaseUrl"

$teacherLogin = Post-Json "$BaseUrl/auth/login" @{ username = $TeacherUsername; password = $TeacherPassword }
Assert-True ($teacherLogin.code -eq "0") "teacher login code"
Assert-True (-not [string]::IsNullOrWhiteSpace($teacherLogin.data.token)) "teacher token exists"
Assert-True ($teacherLogin.data.mustChangePassword -eq $false) "teacher mustChangePassword=false"
$teacherHeaders = @{ Authorization = "Bearer $($teacherLogin.data.token)" }
Write-Host "[account-smoke] teacher login ok"

$template = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$BaseUrl/student-roster-template" -Headers $teacherHeaders
Assert-True ($template.StatusCode -eq 200) "template HTTP 200"
Assert-True ($template.RawContentLength -gt 50) "template has content"
Write-Host "[account-smoke] template download ok, bytes=$($template.RawContentLength)"

if ([string]::IsNullOrWhiteSpace($ClassId) -or [string]::IsNullOrWhiteSpace($ClassName)) {
    $visibleClasses = Invoke-RestMethod -Method Get -Uri "$BaseUrl/classes" -Headers $teacherHeaders
    Assert-True ($visibleClasses.code -eq "0") "visible class list code"

    if ([string]::IsNullOrWhiteSpace($ClassId)) {
        $selectedClass = @($visibleClasses.data) |
            Where-Object { $_.status -eq "ACTIVE" } |
            Select-Object -First 1
        Assert-True ($null -ne $selectedClass) "an active visible class exists"
        $ClassId = $selectedClass.id
        $ClassName = $selectedClass.name
        Write-Host "[account-smoke] auto-selected active class id=$ClassId name=$ClassName"
    } else {
        $selectedClass = @($visibleClasses.data) |
            Where-Object { $_.id -eq $ClassId } |
            Select-Object -First 1
        Assert-True ($null -ne $selectedClass) "specified class is visible"
        if ([string]::IsNullOrWhiteSpace($ClassName)) {
            $ClassName = $selectedClass.name
        }
    }
}

Assert-True (-not [string]::IsNullOrWhiteSpace($ClassId)) "class id is available"
Assert-True (-not [string]::IsNullOrWhiteSpace($ClassName)) "class name is available"

$suffix = (Get-Date -Format "HHmmss")
$studentNo = "202699$suffix"
$initialPassword = $studentNo.Substring($studentNo.Length - 6)
$importBody = @{
    className = $ClassName
    students = @(
        @{
            studentNo = $studentNo
            name = "Smoke Student"
            email = "$studentNo@student.mindmark.local"
            className = $ClassName
            grade = "2026"
            major = "Software Engineering"
        }
    )
}

$import = Post-Json "$BaseUrl/classes/$ClassId/students/import" $importBody $teacherHeaders
Assert-True ($import.code -eq "0") "import code"
Assert-True ($import.data.createdCount -eq 1) "first import creates 1"
Assert-True ($import.data.skippedCount -eq 0) "first import skips 0"
Assert-True ($import.data.failedCount -eq 0) "first import fails 0"
Write-Host "[account-smoke] import ok studentNo=$studentNo"

$reimport = Post-Json "$BaseUrl/classes/$ClassId/students/import" $importBody $teacherHeaders
Assert-True ($reimport.data.createdCount -eq 0) "duplicate import creates 0"
Assert-True ($reimport.data.skippedCount -eq 1) "duplicate import skips 1"
Write-Host "[account-smoke] duplicate skip ok"

$list = Invoke-RestMethod -Method Get -Uri "$BaseUrl/classes/$ClassId/students?page=1&pageSize=100" -Headers $teacherHeaders
Assert-True ($null -ne $list.data.items) "student list returns paged items"
Assert-True ($list.data.total -ge 1) "student list total is available"
Assert-True ($list.data.pageSize -le 100) "student list page size is capped"
$student = $list.data.items | Where-Object { $_.studentNo -eq $studentNo } | Select-Object -First 1
$pageNo = 1
while (($null -eq $student) -and ($pageNo -lt $list.data.totalPages)) {
    $pageNo += 1
    $list = Invoke-RestMethod -Method Get -Uri "$BaseUrl/classes/$ClassId/students?page=$pageNo&pageSize=100" -Headers $teacherHeaders
    $student = $list.data.items | Where-Object { $_.studentNo -eq $studentNo } | Select-Object -First 1
}
Assert-True ($null -ne $student) "student appears in paged class list"
Assert-True ($student.mustChangePassword -eq $true) "new student must change password"
Write-Host "[account-smoke] student list ok"

$studentLogin = Post-Json "$BaseUrl/auth/login" @{ username = $studentNo; password = $initialPassword }
Assert-True ($studentLogin.data.mustChangePassword -eq $true) "student first login mustChangePassword=true"
Write-Host "[account-smoke] student first login ok"

$studentHeaders = @{ Authorization = "Bearer $($studentLogin.data.token)" }
$change = Post-Json "$BaseUrl/auth/change-password" @{ oldPassword = $initialPassword; newPassword = "newpass123" } $studentHeaders
Assert-True ($change.data.success -eq $true) "change password success"
Assert-True ($change.data.mustChangePassword -eq $false) "change password clears flag"
Write-Host "[account-smoke] student change password ok"

$reset = Post-Json "$BaseUrl/students/$($student.id)/reset-password" @{} $teacherHeaders
Assert-True ($reset.data.studentId -eq $student.id) "reset returns target student id"
Assert-True ($reset.data.mustChangePassword -eq $true) "reset sets mustChangePassword=true"
Write-Host "[account-smoke] reset password ok"

Write-Host "[account-smoke] PASS"