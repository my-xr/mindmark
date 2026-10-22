const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobProcessor.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
s = s.replace('import java.util.Optional;\nimport org.springframework.scheduling.annotation.Async;', 'import java.util.Optional;\nimport org.springframework.beans.factory.annotation.Value;\nimport org.springframework.scheduling.annotation.Async;');
s = s.replace('    private final TransactionTemplate transactionTemplate;\n    private final AuthAuditService authAuditService;\n', '    private final TransactionTemplate transactionTemplate;\n    private final AuthAuditService authAuditService;\n    private final long jobTimeoutMs;\n');
s = s.replace(/        AiProviderSettingService aiProviderSettingService,\n        TransactionTemplate transactionTemplate,\n        AuthAuditService authAuditService\n    \) \{/, [
'        AiProviderSettingService aiProviderSettingService,',
'        TransactionTemplate transactionTemplate,',
'        AuthAuditService authAuditService,',
'        @Value("${mindmark.ai.grading.job-timeout-ms:60000}") long jobTimeoutMs',
'    ) {'
].join('\n'));
s = s.replace('        this.transactionTemplate = transactionTemplate;\n        this.authAuditService = authAuditService;\n', '        this.transactionTemplate = transactionTemplate;\n        this.authAuditService = authAuditService;\n        this.jobTimeoutMs = jobTimeoutMs;\n');
s = s.replace(/        List<ItemGradingResult> results = context\.items\(\)\.stream\(\)\n            \.map\(item -> gradeOne\(item, config\)\)\n            \.flatMap\(Optional::stream\)\n            \.toList\(\);\n\n        if \(results\.isEmpty\(\)\) \{/, [
'        List<ItemGradingResult> results;',
'        try {',
'            results = context.items().stream()',
'                .map(item -> gradeOne(item, config))',
'                .flatMap(Optional::stream)',
'                .toList();',
'        } catch (RuntimeException exception) {',
'            markSkipped(jobId, "AI 评分任务执行异常，已保留系统基线分。" + summarize(exception.getMessage()), context.items().size(), 0);',
'            return;',
'        }',
'',
'        if (results.isEmpty()) {'
].join('\n'));
s = s.replace(/    public void recoverPendingJobs\(\) \{\n        jobRepository\.findByStatusInOrderByCreatedAtAsc\(List\.of\(GradingAiJobStatus\.PENDING\)\)\.stream\(\)\n            \.limit\(10\)\n            \.forEach\(job -> process\(job\.getId\(\)\)\);\n    \}\n/, [
'    public void recoverPendingJobs() {',
'        jobRepository.findByStatusInOrderByCreatedAtAsc(List.of(GradingAiJobStatus.PENDING)).stream()',
'            .limit(10)',
'            .forEach(job -> process(job.getId()));',
'        recoverStalledRunningJobs();',
'    }',
'',
'    private void recoverStalledRunningJobs() {',
'        OffsetDateTime deadline = OffsetDateTime.now().minus(Duration.ofMillis(Math.max(1000L, jobTimeoutMs)));',
'        jobRepository.findByStatusInOrderByCreatedAtAsc(List.of(GradingAiJobStatus.RUNNING)).stream()',
'            .filter(job -> job.getStartedAt() != null && job.getStartedAt().isBefore(deadline))',
'            .limit(10)',
'            .forEach(job -> markSkipped(',
'                job.getId(),',
'                "AI 评分任务超过最大执行时间，已停止等待并保留系统基线分。",',
'                job.getProcessedItemCount(),',
'                job.getRefreshedItemCount()',
'            ));',
'    }',
].join('\n'));
s = s.replace(/            GradingAiJobEntity job = jobRepository\.findById\(jobId\)\.orElse\(null\);\n            if \(job == null\) \{\n                return;\n            \}\n            GradingTaskEntity task = gradingTaskRepository\.findWithItemsById\(job\.getGradingTask\(\)\.getId\(\)\)\.orElse\(null\);/, [
'            GradingAiJobEntity job = jobRepository.findById(jobId).orElse(null);',
'            if (job == null || job.getStatus() != GradingAiJobStatus.RUNNING) {',
'                return;',
'            }',
'            GradingTaskEntity task = gradingTaskRepository.findWithItemsById(job.getGradingTask().getId()).orElse(null);'
].join('\n'));
fs.writeFileSync(path, s, 'utf8');
