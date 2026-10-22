const fs = require('fs');
const content = String.raw`param(
    [string] $HostName = "localhost",
    [int] $Port = 5432,
    [string] $Database = "mindmark",
    [string] $Username = "postgres",
    [string] $Password = $env:PGPASSWORD,
    [string] $OutputPath = ".tmp/pagination-explain-report.txt"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    throw "psql was not found in PATH. Install PostgreSQL client or add psql to PATH before running EXPLAIN sampling."
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    throw "PostgreSQL password is required. Pass -Password or set PGPASSWORD."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location $repoRoot
New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath) | Out-Null

$sql = @"
\echo '## question bank: status/source/updated_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, source, updated_at
FROM question
WHERE status = 'ACTIVE' AND source IN ('MANUAL', 'AI', 'IMPORT')
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## question bank: course/status/source/updated_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, course_id, status, source, updated_at
FROM question
WHERE course_id = COALESCE((SELECT course_id FROM question WHERE course_id IS NOT NULL LIMIT 1), 'course-frontend-001')
  AND status = 'ACTIVE'
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## paper assembly available pool: exclude selected paper questions'
EXPLAIN (ANALYZE, BUFFERS)
SELECT q.id, q.title, q.course_id, q.updated_at
FROM question q
WHERE q.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM paper_question pq
    WHERE pq.question_id = q.id
      AND pq.paper_id = COALESCE((SELECT id FROM paper ORDER BY updated_at DESC LIMIT 1), '__NO_PAPER__')
  )
ORDER BY q.updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## paper list: status/updated_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, updated_at
FROM paper
WHERE status IN ('DRAFT', 'READY', 'ARCHIVED')
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## exam list: updated_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, updated_at
FROM exam
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## grading queue: status/updated_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, exam_id, status, updated_at
FROM grading_task
WHERE status <> 'REVIEWED'
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

\echo '## AI generation task: teacher/status/requested_at pagination'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, teacher_id, status, requested_at
FROM ai_question_generation_task
ORDER BY requested_at DESC
LIMIT 20 OFFSET 0;
"@

$sqlPath = ".tmp/pagination-explain.sql"
[System.IO.File]::WriteAllText((Resolve-Path .).Path + "\$sqlPath", $sql, [System.Text.UTF8Encoding]::new($false))

$env:PGPASSWORD = $Password
& psql -h $HostName -p $Port -U $Username -d $Database -v ON_ERROR_STOP=1 -f $sqlPath | Tee-Object -FilePath $OutputPath
if ($LASTEXITCODE -ne 0) {
    throw "psql exited with code $LASTEXITCODE"
}
Write-Host "[pagination-explain] Report written to $OutputPath" -ForegroundColor Green
`;
fs.writeFileSync('scripts/db/run-pagination-explain.ps1', content.replace(/\n/g, '\r\n'), 'utf8');
