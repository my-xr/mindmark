param(
    [string] $DbHost = $env:MINDMARK_DB_HOST,
    [int] $DbPort = $(if ($env:MINDMARK_DB_PORT) { [int]$env:MINDMARK_DB_PORT } else { 5432 }),
    [string] $DbName = $(if ($env:MINDMARK_DB_NAME) { $env:MINDMARK_DB_NAME } else { "mindmark" }),
    [string] $DbUser = $(if ($env:MINDMARK_DB_USERNAME) { $env:MINDMARK_DB_USERNAME } else { "postgres" }),
    [string] $DbPassword = $env:MINDMARK_DB_PASSWORD,
    [string] $PsqlPath = $env:PSQL_PATH,
    [switch] $Execute,
    [switch] $Force
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbHost)) { $DbHost = "localhost" }
if ([string]::IsNullOrWhiteSpace($DbPassword)) { $DbPassword = "123456" }

if ($DbName -eq "postgres") {
    throw "Refuse to clean the default postgres database. Please target the mindmark database."
}

$psqlExe = $null
if (-not [string]::IsNullOrWhiteSpace($PsqlPath)) {
    if (-not (Test-Path -LiteralPath $PsqlPath)) {
        throw "PsqlPath does not exist: $PsqlPath"
    }
    $psqlExe = (Resolve-Path -LiteralPath $PsqlPath).Path
} else {
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if ($null -ne $psql) {
        $psqlExe = $psql.Source
    } else {
        $commonRoots = @(
            "C:\Program Files\PostgreSQL",
            "C:\Program Files (x86)\PostgreSQL",
            "D:\Program Files\PostgreSQL",
            "D:\Program Files (x86)\PostgreSQL",
            "D:\PostgreSQL"
        )
        foreach ($root in $commonRoots) {
            if ($psqlExe) { break }
            if (Test-Path -LiteralPath $root) {
                $candidate = Get-ChildItem -LiteralPath $root -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
                    Sort-Object FullName |
                    Select-Object -First 1
                if ($candidate) { $psqlExe = $candidate.FullName }
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($psqlExe)) {
    throw "psql was not found. Install PostgreSQL client tools, add psql to PATH, or pass -PsqlPath."
}
$env:PGPASSWORD = $DbPassword
$env:PGCLIENTENCODING = "UTF8"

$mode = if ($Execute) { "EXECUTE" } else { "DRY_RUN" }
Write-Host "[cleanup-smoke-data] mode=$mode db=$DbUser@$DbHost`:$DbPort/$DbName"
Write-Host "[cleanup-smoke-data] dry-run is the default. Add -Execute -Force to delete matched test data."

if ($Execute -and -not $Force) {
    throw "Destructive cleanup requires both -Execute and -Force. Re-run with -Force after reviewing dry-run counts."
}

$sql = @"
\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE mm_cleanup_target_course AS
SELECT id
FROM course
WHERE code ILIKE 'SMOKE-%'
   OR code ILIKE 'E2E-%'
   OR code ILIKE 'ADMIN-%'
   OR name ILIKE 'Smoke Course%'
   OR name ILIKE 'Grading Smoke Course%'
   OR name ILIKE 'Admin Acceptance Course%'
   OR name ILIKE '100 %'
   OR name ILIKE '100 ?%'
   OR name ILIKE '%E2E%';

CREATE TEMP TABLE mm_cleanup_target_class AS
SELECT id
FROM teaching_class
WHERE course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR name ILIKE 'Smoke Class%'
   OR name ILIKE 'Grading Smoke Class%'
   OR name ILIKE 'Admin Acceptance Class%'
   OR name ILIKE '100 %'
   OR name ILIKE '100 ?%'
   OR name ILIKE '%E2E%';

CREATE TEMP TABLE mm_cleanup_target_question AS
SELECT id
FROM question
WHERE course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR title ILIKE '100 %'
   OR title ILIKE '100 ?%'
   OR title LIKE '%????%';

CREATE TEMP TABLE mm_cleanup_target_paper AS
SELECT DISTINCT p.id
FROM paper p
LEFT JOIN paper_question pq ON pq.paper_id = p.id
WHERE p.course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR p.title ILIKE '100 %'
   OR p.title ILIKE '100 ?%'
   OR p.title ILIKE '%Smoke%'
   OR p.title ILIKE '%E2E%'
   OR pq.question_id IN (SELECT id FROM mm_cleanup_target_question);

CREATE TEMP TABLE mm_cleanup_target_exam AS
SELECT id
FROM exam
WHERE paper_id IN (SELECT id FROM mm_cleanup_target_paper)
   OR title ILIKE '100 %'
   OR title ILIKE '100 ?%'
   OR title ILIKE '%Smoke%'
   OR title ILIKE '%E2E%';

CREATE TEMP TABLE mm_cleanup_target_student AS
SELECT DISTINCT au.id
FROM auth_user au
LEFT JOIN student_profile sp ON sp.user_id = au.id
WHERE au.username ILIKE '2026%'
  AND (
      au.name ILIKE '%Smoke%'
      OR au.name ILIKE '%E2E%'
      OR au.name ILIKE '100 %'
      OR sp.class_id IN (SELECT id FROM mm_cleanup_target_class)
  );

SELECT 'target_course' AS bucket, count(*) AS rows FROM mm_cleanup_target_course
UNION ALL SELECT 'target_class', count(*) FROM mm_cleanup_target_class
UNION ALL SELECT 'target_question', count(*) FROM mm_cleanup_target_question
UNION ALL SELECT 'target_paper', count(*) FROM mm_cleanup_target_paper
UNION ALL SELECT 'target_exam', count(*) FROM mm_cleanup_target_exam
UNION ALL SELECT 'target_student_account', count(*) FROM mm_cleanup_target_student
ORDER BY bucket;

-- Always show a small sample so the operator can confirm the scope.
SELECT 'course' AS kind, id, name AS label FROM course WHERE id IN (SELECT id FROM mm_cleanup_target_course) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'question' AS kind, id, title AS label FROM question WHERE id IN (SELECT id FROM mm_cleanup_target_question) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'exam' AS kind, id, title AS label FROM exam WHERE id IN (SELECT id FROM mm_cleanup_target_exam) ORDER BY updated_at DESC NULLS LAST LIMIT 10;

"@

if ($Execute) {
    $sql += @"

DELETE FROM score_report WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM grading_ai_job WHERE grading_task_id IN (SELECT id FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM grading_item WHERE grading_task_id IN (SELECT id FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_security_event WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM review_artifact WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM review_lecture_draft WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM ai_lecture_draft_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM answer_item WHERE answer_sheet_id IN (SELECT id FROM answer_sheet WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM answer_sheet WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_participant WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_class WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam WHERE id IN (SELECT id FROM mm_cleanup_target_exam);

DELETE FROM paper_question WHERE paper_id IN (SELECT id FROM mm_cleanup_target_paper) OR question_id IN (SELECT id FROM mm_cleanup_target_question);
DELETE FROM paper WHERE id IN (SELECT id FROM mm_cleanup_target_paper);

DELETE FROM ai_question_generation_task WHERE course_id IN (SELECT id FROM mm_cleanup_target_course);
DELETE FROM question_knowledge_point WHERE question_id IN (SELECT id FROM mm_cleanup_target_question);
DELETE FROM question WHERE id IN (SELECT id FROM mm_cleanup_target_question);

DELETE FROM teacher_class_assignment WHERE class_id IN (SELECT id FROM mm_cleanup_target_class) OR user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM student_profile WHERE class_id IN (SELECT id FROM mm_cleanup_target_class) OR user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM auth_user_role WHERE user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM auth_user WHERE id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM teaching_class WHERE id IN (SELECT id FROM mm_cleanup_target_class);
DELETE FROM course WHERE id IN (SELECT id FROM mm_cleanup_target_course);

COMMIT;
"@
} else {
    $sql += @"

ROLLBACK;
"@
}

$tempSql = Join-Path $env:TEMP ("mindmark-cleanup-smoke-data-{0}.sql" -f ([Guid]::NewGuid().ToString("N")))
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tempSql, $sql, $utf8NoBom)
try {
    & $psqlExe -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $tempSql
    if ($LASTEXITCODE -ne 0) { throw "psql exited with code $LASTEXITCODE" }
} finally {
    Remove-Item -LiteralPath $tempSql -Force -ErrorAction SilentlyContinue
}
