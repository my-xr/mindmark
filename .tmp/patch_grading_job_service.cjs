const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobService.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
s = s.replace('import java.time.OffsetDateTime;\n', 'import java.time.Duration;\nimport java.time.OffsetDateTime;\n');
s = s.replace('    private final boolean asyncEnabled;\n', '    private final boolean asyncEnabled;\n    private final long jobTimeoutMs;\n');
s = s.replace(/        GradingAiJobMapper mapper,\n        ClassScopeService classScopeService,\n        @Value\("\$\{mindmark\.ai\.grading\.async-enabled:true\}"\) boolean asyncEnabled\n    \) \{/, [
'        GradingAiJobMapper mapper,',
'        ClassScopeService classScopeService,',
'        @Value("${mindmark.ai.grading.async-enabled:true}") boolean asyncEnabled,',
'        @Value("${mindmark.ai.grading.job-timeout-ms:60000}") long jobTimeoutMs',
'    ) {'
].join('\n'));
s = s.replace('        this.classScopeService = classScopeService;\n        this.asyncEnabled = asyncEnabled;\n', '        this.classScopeService = classScopeService;\n        this.asyncEnabled = asyncEnabled;\n        this.jobTimeoutMs = jobTimeoutMs;\n');
s = s.replace('    @Transactional(readOnly = true)\n    public GradingAiJobResponse latestJob(String gradingTaskId) {', '    @Transactional\n    public GradingAiJobResponse latestJob(String gradingTaskId) {');
s = s.replace(/        return jobRepository\.findTopByGradingTaskIdOrderByCreatedAtDesc\(gradingTaskId\)\n            \.map\(mapper::toResponse\)\n            \.orElse\(null\);/, [
'        return jobRepository.findTopByGradingTaskIdOrderByCreatedAtDesc(gradingTaskId)',
'            .map(this::expireStalledRunningJobIfNeeded)',
'            .map(mapper::toResponse)',
'            .orElse(null);'
].join('\n'));
s = s.replace('    private void dispatchAfterCommit(String jobId) {', [
'    private GradingAiJobEntity expireStalledRunningJobIfNeeded(GradingAiJobEntity job) {',
'        if (job.getStatus() != GradingAiJobStatus.RUNNING || job.getStartedAt() == null) {',
'            return job;',
'        }',
'        OffsetDateTime deadline = OffsetDateTime.now().minus(Duration.ofMillis(Math.max(1000L, jobTimeoutMs)));',
'        if (!job.getStartedAt().isBefore(deadline)) {',
'            return job;',
'        }',
'        OffsetDateTime now = OffsetDateTime.now();',
'        job.setStatus(GradingAiJobStatus.SKIPPED);',
'        job.setErrorMessage("AI 评分任务超过最大执行时间，已停止等待并保留系统基线分。");',
'        job.setResultSummary(job.getErrorMessage());',
'        job.setDurationMs(Math.max(0L, Duration.between(job.getStartedAt(), now).toMillis()));',
'        job.setFinishedAt(now);',
'        job.setUpdatedAt(now);',
'        return jobRepository.save(job);',
'    }',
'',
'    private void dispatchAfterCommit(String jobId) {'
].join('\n'));
fs.writeFileSync(path, s, 'utf8');
