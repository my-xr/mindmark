param(
    [string] $HostName = "localhost",
    [int] $Port = 5432,
    [string] $Database = "mindmark",
    [string] $Username = "postgres",
    [string] $Password = $env:PGPASSWORD,
    [string] $OutputPath = ".tmp/pagination-explain-report.txt"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Password)) {
    throw "PostgreSQL password is required. Pass -Password or set PGPASSWORD."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location $repoRoot
New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath) | Out-Null
New-Item -ItemType Directory -Force -Path ".tmp" | Out-Null

$jdbcJar = Get-ChildItem -Path "$env:USERPROFILE\.m2\repository\org\postgresql\postgresql" -Recurse -Filter "postgresql-*.jar" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if (-not $jdbcJar) {
    throw "PostgreSQL JDBC driver was not found in local Maven repository. Run backend Maven test once or install org.postgresql:postgresql."
}
$localJdbcJar = Join-Path ".tmp" "postgresql-jdbc.jar"
Copy-Item -LiteralPath $jdbcJar.FullName -Destination $localJdbcJar -Force

$javaSource = @"
import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.List;

public class PaginationExplainRunner {
    record ExplainCase(String title, String sql) {}

    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            throw new IllegalArgumentException("Usage: PaginationExplainRunner <jdbcUrl> <username> <password>");
        }
        String jdbcUrl = args[0];
        String username = args[1];
        String password = args[2];

        List<ExplainCase> cases = List.of(
            new ExplainCase("question bank: status/source/updated_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, title, status, source, updated_at " +
                "FROM question " +
                "WHERE status = 'ACTIVE' AND source IN ('MANUAL', 'AI', 'IMPORT') " +
                "ORDER BY updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("question bank: course/status/source/updated_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, title, course_id, status, source, updated_at " +
                "FROM question " +
                "WHERE course_id = COALESCE((SELECT course_id FROM question WHERE course_id IS NOT NULL LIMIT 1), 'course-frontend-001') " +
                "AND status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("paper assembly available pool: exclude selected paper questions",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT q.id, q.title, q.course_id, q.updated_at FROM question q " +
                "WHERE q.status = 'ACTIVE' AND NOT EXISTS (" +
                "SELECT 1 FROM paper_question pq WHERE pq.question_id = q.id " +
                "AND pq.paper_id = COALESCE((SELECT id FROM paper ORDER BY updated_at DESC LIMIT 1), '__NO_PAPER__')) " +
                "ORDER BY q.updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("paper list: status/updated_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, title, status, updated_at FROM paper " +
                "WHERE status IN ('DRAFT', 'READY', 'ARCHIVED') ORDER BY updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("exam list: updated_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, title, status, updated_at FROM exam ORDER BY updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("grading queue: status/updated_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, exam_id, status, updated_at FROM grading_task " +
                "WHERE status <> 'REVIEWED' ORDER BY updated_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("AI generation task: teacher/status/requested_at pagination",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT id, teacher_id, status, requested_at FROM ai_question_generation_task " +
                "ORDER BY requested_at DESC LIMIT 20 OFFSET 0"),
            new ExplainCase("teacher dashboard: ongoing exams first screen",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT e.id, e.title, e.status, e.updated_at FROM exam e " +
                "WHERE e.status = 'ONGOING' AND EXISTS (SELECT 1 FROM exam_class ec WHERE ec.exam_id = e.id) " +
                "ORDER BY e.updated_at DESC LIMIT 2 OFFSET 0"),
            new ExplainCase("teacher dashboard: grading tasks first screen",
                "EXPLAIN (ANALYZE, BUFFERS) " +
                "SELECT gt.id, gt.exam_id, gt.status, gt.updated_at FROM grading_task gt " +
                "JOIN exam e ON e.id = gt.exam_id " +
                "WHERE gt.status <> 'REVIEWED' AND EXISTS (SELECT 1 FROM exam_class ec WHERE ec.exam_id = e.id) " +
                "ORDER BY gt.updated_at DESC LIMIT 2 OFFSET 0")
        );

        try (BufferedWriter out = new BufferedWriter(new OutputStreamWriter(System.out, StandardCharsets.UTF_8));
             Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            out.write("# MindMark pagination EXPLAIN report\n");
            out.write("jdbcUrl=" + jdbcUrl + "\n\n");
            for (ExplainCase explainCase : cases) {
                out.write("## " + explainCase.title() + "\n");
                try (PreparedStatement ps = conn.prepareStatement(explainCase.sql());
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        out.write(rs.getString(1));
                        out.write("\n");
                    }
                }
                out.write("\n");
            }
        }
    }
}
"@

$javaPath = Join-Path ".tmp" "PaginationExplainRunner.java"
[System.IO.File]::WriteAllText((Resolve-Path .).Path + "\$javaPath", $javaSource, [System.Text.UTF8Encoding]::new($false))

& javac -encoding UTF-8 -cp $localJdbcJar $javaPath
if ($LASTEXITCODE -ne 0) {
    throw "javac exited with code $LASTEXITCODE"
}

$jdbcUrl = "jdbc:postgresql://$HostName`:$Port/$Database"
& java -cp ".tmp;$($localJdbcJar)" PaginationExplainRunner $jdbcUrl $Username $Password | Tee-Object -FilePath $OutputPath
if ($LASTEXITCODE -ne 0) {
    throw "java exited with code $LASTEXITCODE"
}

Write-Host "[pagination-explain] Report written to $OutputPath" -ForegroundColor Green