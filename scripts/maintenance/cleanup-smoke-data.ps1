param(
    [string] $DbHost = $env:MINDMARK_DB_HOST,
    [int] $DbPort = $(if ($env:MINDMARK_DB_PORT) { [int]$env:MINDMARK_DB_PORT } else { 5432 }),
    [string] $DbName = $(if ($env:MINDMARK_DB_NAME) { $env:MINDMARK_DB_NAME } else { "mindmark" }),
    [string] $DbUser = $(if ($env:MINDMARK_DB_USERNAME) { $env:MINDMARK_DB_USERNAME } else { "postgres" }),
    [string] $DbPassword = $env:MINDMARK_DB_PASSWORD,
    [string] $PsqlPath = $env:PSQL_PATH,
    [string] $PgDumpPath = $env:PG_DUMP_PATH,
    [string] $RunId = "",
    [switch] $IncludeLegacyPatterns,
    [string] $ReportPath = "",
    [string] $BackupPath = "",
    [switch] $Execute,
    [switch] $Force
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbHost)) { $DbHost = "localhost" }
if ([string]::IsNullOrWhiteSpace($DbPassword)) { $DbPassword = "123456" }
if ($DbName -eq "postgres") {
    throw "Refuse to clean the default postgres database. Please target the mindmark database."
}
if ($Execute -and -not $Force) {
    throw "Destructive cleanup requires both -Execute and -Force. Re-run with -Force after reviewing dry-run counts."
}
if ([string]::IsNullOrWhiteSpace($RunId) -and -not $IncludeLegacyPatterns) {
    throw "A precise -RunId is required. Use -IncludeLegacyPatterns only after reviewing its dry-run output."
}
if (-not [string]::IsNullOrWhiteSpace($RunId) -and $RunId -notmatch '^[A-Za-z0-9_-]{6,80}$') {
    throw "RunId must contain only letters, digits, '_' or '-' and be 6-80 characters long."
}
if ($Execute -and [string]::IsNullOrWhiteSpace($BackupPath)) {
    throw "Destructive cleanup requires -BackupPath so the database can be restored if the scope is wrong."
}

function Resolve-Executable([string]$ConfiguredPath, [string]$CommandName, [string[]]$CommonRoots) {
    if (-not [string]::IsNullOrWhiteSpace($ConfiguredPath)) {
        if (-not (Test-Path -LiteralPath $ConfiguredPath)) {
            throw "$CommandName path does not exist: $ConfiguredPath"
        }
        return (Resolve-Path -LiteralPath $ConfiguredPath).Path
    }
    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }
    foreach ($root in $CommonRoots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        $candidate = Get-ChildItem -LiteralPath $root -Recurse -Filter "$CommandName.exe" -ErrorAction SilentlyContinue |
            Sort-Object FullName |
            Select-Object -First 1
        if ($candidate) { return $candidate.FullName }
    }
    throw "$CommandName was not found. Install PostgreSQL client tools, add it to PATH, or pass the corresponding path parameter."
}

$psqlExe = Resolve-Executable $PsqlPath "psql" @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "D:\Program Files\PostgreSQL",
    "D:\Program Files (x86)\PostgreSQL",
    "D:\PostgreSQL"
)
$pgDumpExe = $null
if ($Execute) {
    $pgDumpExe = Resolve-Executable $PgDumpPath "pg_dump" @(
        "C:\Program Files\PostgreSQL",
        "C:\Program Files (x86)\PostgreSQL",
        "D:\Program Files\PostgreSQL",
        "D:\Program Files (x86)\PostgreSQL",
        "D:\PostgreSQL"
    )
}

$reportDirectory = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..")) "target\maintenance"
if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportPath = Join-Path $reportDirectory ("cleanup-smoke-data-{0}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
}
$reportParent = Split-Path -Parent $ReportPath
if (-not [string]::IsNullOrWhiteSpace($reportParent)) {
    New-Item -ItemType Directory -Path $reportParent -Force | Out-Null
}

$mode = if ($Execute) { "EXECUTE" } else { "DRY_RUN" }
$escapedRunId = if ([string]::IsNullOrWhiteSpace($RunId)) { "" } else { $RunId.Replace("'", "''") }
$scopeLabel = if ($escapedRunId) { $RunId } else { "legacy opt-in" }

# Legacy matching is opt-in. The default path only follows one explicit run ID.
$coursePredicate = if ($escapedRunId) {
    "(c.code ILIKE '%$escapedRunId%' OR c.name ILIKE '%$escapedRunId%')"
} else {
    "(c.code ILIKE 'SMOKE-%' OR c.code ILIKE 'E2E-%' OR c.code ILIKE 'ADMIN-%' OR c.code ILIKE 'P100-%' OR c.code ILIKE 'GRD-%' OR c.code ILIKE 'BULK-%' OR c.name ILIKE 'Smoke Course %' OR c.name ILIKE 'Grading Smoke Course %' OR c.name ILIKE 'Admin Acceptance Course %' OR c.name ILIKE '100 分闭环验收课程 %' OR c.name ILIKE '批量体验验收课程 %')"
}
$classPredicate = if ($escapedRunId) {
    "(tc.code ILIKE '%$escapedRunId%' OR tc.name ILIKE '%$escapedRunId%')"
} else {
    "(tc.code ILIKE 'SMOKE-CLS-%' OR tc.code ILIKE 'GRD-CLS-%' OR tc.code ILIKE 'BULK-CLS-%' OR tc.name ILIKE 'Smoke Class %' OR tc.name ILIKE 'Grading Smoke Class %' OR tc.name ILIKE '100 分闭环验收班级 %' OR tc.name ILIKE '批量体验验收班级 %')"
}
$questionPredicate = if ($escapedRunId) {
    "q.title ILIKE '%$escapedRunId%'"
} else {
    "(q.title ILIKE 'Smoke %' OR q.title ILIKE '100 分闭环%' OR q.title ILIKE '批量体验%' OR q.title ILIKE 'Grading %' OR q.title ILIKE 'Admin %')"
}
$paperPredicate = if ($escapedRunId) {
    "p.title ILIKE '%$escapedRunId%'"
} else {
    "(p.title ILIKE 'Smoke %' OR p.title ILIKE '100 分真实闭环验收试卷 %' OR p.title ILIKE '批量体验验收试卷 %' OR p.title ILIKE 'Grading %' OR p.title ILIKE 'Admin %')"
}
$examPredicate = if ($escapedRunId) {
    "e.title ILIKE '%$escapedRunId%'"
} else {
    "(e.title ILIKE '%Smoke %' OR e.title ILIKE '100 分考试闭环验收 %' OR e.title ILIKE '批量体验验收考试 %' OR e.title ILIKE 'Grading %' OR e.title ILIKE 'Admin %')"
}
$studentPredicate = if ($escapedRunId) {
    "(au.username ILIKE '%$escapedRunId%' OR au.email ILIKE '%$escapedRunId%')"
} else {
    "FALSE"
}

$env:PGPASSWORD = $DbPassword
$env:PGCLIENTENCODING = "UTF8"
Write-Host "[cleanup-smoke-data] mode=$mode db=$DbUser@$DbHost`:$DbPort/$DbName"
Write-Host "[cleanup-smoke-data] scope=$scopeLabel"
Write-Host "[cleanup-smoke-data] report=$ReportPath"
Write-Host "[cleanup-smoke-data] dry-run is the default. Execute also requires -Force and -BackupPath."

$sql = @'
\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE mm_cleanup_target_course AS
SELECT c.id FROM course c WHERE __COURSE_PREDICATE__;

CREATE TEMP TABLE mm_cleanup_target_class AS
SELECT tc.id FROM teaching_class tc
WHERE tc.course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR __CLASS_PREDICATE__;

CREATE TEMP TABLE mm_cleanup_target_chapter AS
SELECT cc.id FROM course_chapter cc
WHERE cc.course_id IN (SELECT id FROM mm_cleanup_target_course);

CREATE TEMP TABLE mm_cleanup_target_question AS
SELECT q.id FROM question q
WHERE q.course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR __QUESTION_PREDICATE__;

CREATE TEMP TABLE mm_cleanup_target_paper AS
SELECT DISTINCT p.id FROM paper p
LEFT JOIN paper_question pq ON pq.paper_id = p.id
WHERE p.course_id IN (SELECT id FROM mm_cleanup_target_course)
   OR __PAPER_PREDICATE__
   OR pq.question_id IN (SELECT id FROM mm_cleanup_target_question);

CREATE TEMP TABLE mm_cleanup_target_exam AS
SELECT e.id FROM exam e
WHERE e.paper_id IN (SELECT id FROM mm_cleanup_target_paper)
   OR __EXAM_PREDICATE__;

CREATE TEMP TABLE mm_cleanup_target_student AS
SELECT DISTINCT au.id FROM auth_user au
LEFT JOIN student_profile sp ON sp.user_id = au.id
WHERE EXISTS (
    SELECT 1 FROM auth_user_role aur
    WHERE aur.user_id = au.id AND aur.role_code = 'STUDENT'
)
  AND (
      sp.class_id IN (SELECT id FROM mm_cleanup_target_class)
      OR __STUDENT_PREDICATE__
  );

CREATE TEMP TABLE mm_cleanup_external_question_reference AS
SELECT 'paper_question' AS reference_kind, pq.question_id, count(*) AS reference_count
FROM paper_question pq
WHERE pq.question_id IN (SELECT id FROM mm_cleanup_target_question)
  AND pq.paper_id NOT IN (SELECT id FROM mm_cleanup_target_paper)
GROUP BY pq.question_id
UNION ALL
SELECT 'answer_item' AS reference_kind, ai.question_id, count(*) AS reference_count
FROM answer_item ai
JOIN answer_sheet ash ON ash.id = ai.answer_sheet_id
WHERE ai.question_id IN (SELECT id FROM mm_cleanup_target_question)
  AND ash.exam_id NOT IN (SELECT id FROM mm_cleanup_target_exam)
GROUP BY ai.question_id
UNION ALL
SELECT 'grading_item' AS reference_kind, gi.question_id, count(*) AS reference_count
FROM grading_item gi
JOIN grading_task gt ON gt.id = gi.grading_task_id
WHERE gi.question_id IN (SELECT id FROM mm_cleanup_target_question)
  AND gt.exam_id NOT IN (SELECT id FROM mm_cleanup_target_exam)
GROUP BY gi.question_id
UNION ALL
SELECT 'programming_judge_submission' AS reference_kind, pjs.question_id, count(*) AS reference_count
FROM programming_judge_submission pjs
WHERE pjs.question_id IN (SELECT id FROM mm_cleanup_target_question)
  AND pjs.exam_id NOT IN (SELECT id FROM mm_cleanup_target_exam)
GROUP BY pjs.question_id;

SELECT 'target_course' AS bucket, count(*) AS rows FROM mm_cleanup_target_course
UNION ALL SELECT 'target_class', count(*) FROM mm_cleanup_target_class
UNION ALL SELECT 'target_chapter', count(*) FROM mm_cleanup_target_chapter
UNION ALL SELECT 'target_question', count(*) FROM mm_cleanup_target_question
UNION ALL SELECT 'target_paper', count(*) FROM mm_cleanup_target_paper
UNION ALL SELECT 'target_exam', count(*) FROM mm_cleanup_target_exam
UNION ALL SELECT 'target_student_account', count(*) FROM mm_cleanup_target_student
UNION ALL SELECT 'external_question_reference', coalesce(sum(reference_count), 0) FROM mm_cleanup_external_question_reference
ORDER BY bucket;

SELECT 'course' AS kind, id, name AS label FROM course WHERE id IN (SELECT id FROM mm_cleanup_target_course) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'chapter' AS kind, id, title AS label FROM course_chapter WHERE id IN (SELECT id FROM mm_cleanup_target_chapter) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'question' AS kind, id, title AS label FROM question WHERE id IN (SELECT id FROM mm_cleanup_target_question) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'paper' AS kind, id, title AS label FROM paper WHERE id IN (SELECT id FROM mm_cleanup_target_paper) ORDER BY updated_at DESC NULLS LAST LIMIT 10;
SELECT 'exam' AS kind, id, title AS label FROM exam WHERE id IN (SELECT id FROM mm_cleanup_target_exam) ORDER BY updated_at DESC NULLS LAST LIMIT 10;

\echo __MINDMARK_CLEANUP_REPORT__
\pset format unaligned
\pset tuples_only on
WITH counts AS (
    SELECT 'target_course' AS bucket, count(*) AS row_count FROM mm_cleanup_target_course
    UNION ALL SELECT 'target_class', count(*) FROM mm_cleanup_target_class
    UNION ALL SELECT 'target_chapter', count(*) FROM mm_cleanup_target_chapter
    UNION ALL SELECT 'target_question', count(*) FROM mm_cleanup_target_question
    UNION ALL SELECT 'target_paper', count(*) FROM mm_cleanup_target_paper
    UNION ALL SELECT 'target_exam', count(*) FROM mm_cleanup_target_exam
    UNION ALL SELECT 'target_student_account', count(*) FROM mm_cleanup_target_student
    UNION ALL SELECT 'external_question_reference', coalesce(sum(reference_count), 0) FROM mm_cleanup_external_question_reference
), sample_rows AS (
    (SELECT 'course' AS kind, id::text, name::text AS label
    FROM course WHERE id IN (SELECT id FROM mm_cleanup_target_course)
    ORDER BY updated_at DESC NULLS LAST LIMIT 10)
    UNION ALL
    (SELECT 'chapter', id::text, title::text
    FROM course_chapter WHERE id IN (SELECT id FROM mm_cleanup_target_chapter)
    ORDER BY updated_at DESC NULLS LAST LIMIT 10)
    UNION ALL
    (SELECT 'question', id::text, title::text
    FROM question WHERE id IN (SELECT id FROM mm_cleanup_target_question)
    ORDER BY updated_at DESC NULLS LAST LIMIT 10)
    UNION ALL
    (SELECT 'paper', id::text, title::text
    FROM paper WHERE id IN (SELECT id FROM mm_cleanup_target_paper)
    ORDER BY updated_at DESC NULLS LAST LIMIT 10)
    UNION ALL
    (SELECT 'exam', id::text, title::text
    FROM exam WHERE id IN (SELECT id FROM mm_cleanup_target_exam)
    ORDER BY updated_at DESC NULLS LAST LIMIT 10)
), external_rows AS (
    SELECT reference_kind, question_id::text, reference_count
    FROM mm_cleanup_external_question_reference
)
SELECT jsonb_build_object(
    'targetCounts', (SELECT jsonb_object_agg(bucket, row_count) FROM counts),
    'samples', coalesce((SELECT jsonb_agg(to_jsonb(sample_rows)) FROM sample_rows), '[]'::jsonb),
    'externalQuestionReferences', coalesce((SELECT jsonb_agg(to_jsonb(external_rows)) FROM external_rows), '[]'::jsonb)
)::text;
\pset tuples_only off
\pset format aligned

DO $mm$
BEGIN
    IF EXISTS (SELECT 1 FROM mm_cleanup_external_question_reference) THEN
        RAISE EXCEPTION 'scope includes questions referenced by non-target records; use the exact run ID or review the report';
    END IF;
END
$mm$;
'@
$sql = $sql.Replace("__COURSE_PREDICATE__", $coursePredicate)
$sql = $sql.Replace("__CLASS_PREDICATE__", $classPredicate)
$sql = $sql.Replace("__QUESTION_PREDICATE__", $questionPredicate)
$sql = $sql.Replace("__PAPER_PREDICATE__", $paperPredicate)
$sql = $sql.Replace("__EXAM_PREDICATE__", $examPredicate)
$sql = $sql.Replace("__STUDENT_PREDICATE__", $studentPredicate)

if ($Execute) {
    $sql += @'

DELETE FROM score_report WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM grading_ai_job WHERE grading_task_id IN (SELECT id FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM grading_item WHERE grading_task_id IN (SELECT id FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM grading_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_security_event WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM review_artifact WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM review_lecture_draft WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM ai_lecture_draft_task WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM programming_judge_submission WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM answer_item WHERE answer_sheet_id IN (SELECT id FROM answer_sheet WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam));
DELETE FROM answer_sheet WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_participant WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam_class WHERE exam_id IN (SELECT id FROM mm_cleanup_target_exam);
DELETE FROM exam WHERE id IN (SELECT id FROM mm_cleanup_target_exam);

DELETE FROM paper_question WHERE paper_id IN (SELECT id FROM mm_cleanup_target_paper);
DELETE FROM paper WHERE id IN (SELECT id FROM mm_cleanup_target_paper);

DELETE FROM ai_question_generation_task WHERE course_id IN (SELECT id FROM mm_cleanup_target_course);
DELETE FROM question_knowledge_point WHERE question_id IN (SELECT id FROM mm_cleanup_target_question);
DELETE FROM programming_test_case WHERE question_id IN (SELECT id FROM mm_cleanup_target_question);
DELETE FROM question WHERE id IN (SELECT id FROM mm_cleanup_target_question);

DELETE FROM course_chapter WHERE id IN (SELECT id FROM mm_cleanup_target_chapter);
DELETE FROM roster_import_task WHERE class_id IN (SELECT id FROM mm_cleanup_target_class);
DELETE FROM teacher_class_assignment WHERE class_id IN (SELECT id FROM mm_cleanup_target_class) OR user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM student_profile WHERE class_id IN (SELECT id FROM mm_cleanup_target_class) OR user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM auth_user_role WHERE user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM auth_audit_log WHERE target_user_id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM auth_user WHERE id IN (SELECT id FROM mm_cleanup_target_student);
DELETE FROM teaching_class WHERE id IN (SELECT id FROM mm_cleanup_target_class);
DELETE FROM course WHERE id IN (SELECT id FROM mm_cleanup_target_course);

COMMIT;
'@
} else {
    $sql += @'

ROLLBACK;
'@
}

$tempSql = Join-Path $env:TEMP ("mindmark-cleanup-smoke-data-{0}.sql" -f ([Guid]::NewGuid().ToString("N")))
$tempOutput = Join-Path $env:TEMP ("mindmark-cleanup-smoke-data-{0}.out" -f ([Guid]::NewGuid().ToString("N")))
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tempSql, $sql, $utf8NoBom)
$backupCreated = $false
try {
    if ($Execute) {
        $backupParent = Split-Path -Parent $BackupPath
        if (-not [string]::IsNullOrWhiteSpace($backupParent)) {
            New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
        }
        Write-Host "[cleanup-smoke-data] creating full backup at $BackupPath"
        & $pgDumpExe -h $DbHost -p $DbPort -U $DbUser -d $DbName --format=custom --file=$BackupPath
        if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with code $LASTEXITCODE" }
        $backupCreated = $true
    }

    & $psqlExe -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $tempSql *> $tempOutput
    $psqlExitCode = $LASTEXITCODE
    $psqlFailure = if ($psqlExitCode -ne 0) { "psql exited with code $psqlExitCode" } else { $null }
    $output = if (Test-Path -LiteralPath $tempOutput) {
        [System.IO.File]::ReadAllText($tempOutput, [System.Text.Encoding]::UTF8)
    } else {
        ""
    }
    if ($output) { Write-Host $output }

    $outputPath = "$ReportPath.log"
    [System.IO.File]::WriteAllText($outputPath, $output, $utf8NoBom)
    $machineReport = $null
    $reportMarker = "__MINDMARK_CLEANUP_REPORT__"
    $markerIndex = $output.IndexOf($reportMarker)
    if ($markerIndex -ge 0) {
        $reportText = $output.Substring($markerIndex + $reportMarker.Length)
        $reportLine = ($reportText -split "`r?`n" |
            Where-Object { $_.TrimStart().StartsWith("{") } |
            Select-Object -First 1)
        try {
            $machineReport = $reportLine | ConvertFrom-Json
        } catch {
            throw "Could not parse the structured cleanup report emitted by psql: $($_.Exception.Message)"
        }
    } else {
        if ($psqlFailure) { throw $psqlFailure }
        throw "The cleanup SQL did not emit the structured report marker."
    }
    $report = [ordered]@{
        generatedAt = (Get-Date).ToUniversalTime().ToString("o")
        mode = $mode
        database = "$DbHost`:$DbPort/$DbName"
        runId = if ($RunId) { $RunId } else { $null }
        includeLegacyPatterns = [bool]$IncludeLegacyPatterns
        backupCreated = $backupCreated
        backupPath = if ($backupCreated) { (Resolve-Path -LiteralPath $BackupPath).Path } else { $null }
        outputPath = $outputPath
        targetCounts = $machineReport.targetCounts
        samples = @($machineReport.samples)
        externalQuestionReferences = @($machineReport.externalQuestionReferences)
    }
    [System.IO.File]::WriteAllText($ReportPath, ($report | ConvertTo-Json -Depth 8), $utf8NoBom)
    Write-Host "[cleanup-smoke-data] report written to $ReportPath" -ForegroundColor Green
    if ($psqlFailure) { throw $psqlFailure }
} finally {
    Remove-Item -LiteralPath $tempSql -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $tempOutput -Force -ErrorAction SilentlyContinue
}
