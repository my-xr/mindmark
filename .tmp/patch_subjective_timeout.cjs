const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
s = s.replace('import java.util.Set;\nimport java.util.regex.Pattern;\nimport org.springframework.beans.factory.annotation.Value;\n', [
'import java.util.Set;',
'import java.util.concurrent.CompletableFuture;',
'import java.util.concurrent.ExecutionException;',
'import java.util.concurrent.Executor;',
'import java.util.concurrent.TimeUnit;',
'import java.util.concurrent.TimeoutException;',
'import java.util.regex.Pattern;',
'import org.springframework.beans.factory.annotation.Qualifier;',
'import org.springframework.beans.factory.annotation.Value;',
].join('\n'));
s = s.replace('    private final int providerMaxTokens;\n', '    private final int providerMaxTokens;\n    private final Executor providerExecutor;\n');
s = s.replace(/        @Value\("\$\{mindmark\.ai\.grading\.provider-enabled:true\}"\) boolean providerGradingEnabled,\n        @Value\("\$\{mindmark\.ai\.grading\.timeout-ms:25000\}"\) long providerRequestTimeoutMs,\n        @Value\("\$\{mindmark\.ai\.grading\.max-tokens:1000\}"\) int providerMaxTokens\n    \) \{/, [
'        @Value("${mindmark.ai.grading.provider-enabled:true}") boolean providerGradingEnabled,',
'        @Value("${mindmark.ai.grading.timeout-ms:25000}") long providerRequestTimeoutMs,',
'        @Value("${mindmark.ai.grading.max-tokens:1000}") int providerMaxTokens,',
'        @Qualifier("gradingAiProviderTaskExecutor") Executor providerExecutor',
'    ) {'
].join('\n'));
s = s.replace('        this.providerRequestTimeoutMs = providerRequestTimeoutMs;\n        this.providerMaxTokens = providerMaxTokens;\n', '        this.providerRequestTimeoutMs = providerRequestTimeoutMs;\n        this.providerMaxTokens = providerMaxTokens;\n        this.providerExecutor = providerExecutor;\n');
s = s.replace(/        try \{\n            String content = aiChatQuestionGenerationClient\.completeText\(\n                config,\n                buildProviderPrompt\(question, answer, safeMaxScore\),\n                Math\.max\(256, providerMaxTokens\),\n                AI_GRADING_SYSTEM_PROMPT,\n                providerRequestTimeoutMs\n            \);\n            return Optional\.ofNullable\(parseProviderResult\(question, content, safeMaxScore, config\)\);\n        \} catch \(RuntimeException exception\) \{\n            return Optional\.empty\(\);\n        \}/, [
'        try {',
'            CompletableFuture<String> future = CompletableFuture.supplyAsync(',
'                () -> aiChatQuestionGenerationClient.completeText(',
'                    config,',
'                    buildProviderPrompt(question, answer, safeMaxScore),',
'                    Math.max(256, providerMaxTokens),',
'                    AI_GRADING_SYSTEM_PROMPT,',
'                    providerRequestTimeoutMs',
'                ),',
'                providerExecutor',
'            );',
'            String content = future.get(Math.max(1000L, providerRequestTimeoutMs), TimeUnit.MILLISECONDS);',
'            return Optional.ofNullable(parseProviderResult(question, content, safeMaxScore, config));',
'        } catch (InterruptedException exception) {',
'            Thread.currentThread().interrupt();',
'            return Optional.empty();',
'        } catch (ExecutionException | TimeoutException | RuntimeException exception) {',
'            return Optional.empty();',
'        }'
].join('\n'));
fs.writeFileSync(path, s, 'utf8');
