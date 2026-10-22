const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobProcessor.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
s = s.replace('import java.util.LinkedHashMap;\nimport java.util.List;\nimport java.util.Map;\nimport java.util.Optional;\n', [
'import java.util.ArrayList;',
'import java.util.LinkedHashMap;',
'import java.util.List;',
'import java.util.Map;',
'import java.util.Optional;',
'import java.util.concurrent.CompletableFuture;',
'import java.util.concurrent.ExecutionException;',
'import java.util.concurrent.ExecutorService;',
'import java.util.concurrent.Executors;',
'import java.util.concurrent.TimeUnit;',
'import java.util.concurrent.TimeoutException;',
].join('\n'));
s = s.replace(/        List<ItemGradingResult> results;\n        try \{\n            results = context\.items\(\)\.parallelStream\(\)\n                \.map\(item -> gradeOne\(item, config\)\)\n                \.flatMap\(Optional::stream\)\n                \.toList\(\);\n        \} catch \(RuntimeException exception\) \{\n            markSkipped\(jobId, "AI 评分任务执行异常，已保留系统基线分。" \+ summarize\(exception\.getMessage\(\)\), context\.items\(\)\.size\(\), 0\);\n            return;\n        \}/, [
'        List<ItemGradingResult> results;',
'        try {',
'            results = gradeAllWithinJobDeadline(context, config);',
'        } catch (RuntimeException exception) {',
'            markSkipped(jobId, "AI 评分任务执行异常，已保留系统基线分。" + summarize(exception.getMessage()), context.items().size(), 0);',
'            return;',
'        }'
].join('\n'));
s = s.replace('    private Optional<ItemGradingResult> gradeOne(WorkItem item, AiProviderRuntimeConfig config) {', [
'    private List<ItemGradingResult> gradeAllWithinJobDeadline(JobContext context, AiProviderRuntimeConfig config) {',
'        long deadlineNanos = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(Math.max(1000L, jobTimeoutMs - 1000L));',
'        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {',
'            List<CompletableFuture<Optional<ItemGradingResult>>> futures = context.items().stream()',
'                .map(item -> CompletableFuture.supplyAsync(() -> gradeOne(item, config), executor))',
'                .toList();',
'            ArrayList<ItemGradingResult> results = new ArrayList<>();',
'            for (CompletableFuture<Optional<ItemGradingResult>> future : futures) {',
'                long remainingNanos = deadlineNanos - System.nanoTime();',
'                if (remainingNanos <= 0) {',
'                    break;',
'                }',
'                try {',
'                    future.get(remainingNanos, TimeUnit.NANOSECONDS).ifPresent(results::add);',
'                } catch (InterruptedException exception) {',
'                    Thread.currentThread().interrupt();',
'                    break;',
'                } catch (ExecutionException | TimeoutException exception) {',
'                    // 单题 AI 评分失败不影响整张答卷，保留该题系统基线分。',
'                }',
'            }',
'            return List.copyOf(results);',
'        }',
'    }',
'',
'    private Optional<ItemGradingResult> gradeOne(WorkItem item, AiProviderRuntimeConfig config) {'
].join('\n'));
fs.writeFileSync(path, s, 'utf8');
