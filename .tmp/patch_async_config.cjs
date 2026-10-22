const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/common/config/AsyncConfig.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
if (!s.includes('gradingAiProviderTaskExecutor')) {
  s = s.replace('    @Bean(name = "gradingAiTaskExecutor")\n', [
'    @Bean(name = "gradingAiProviderTaskExecutor")',
'    public ThreadPoolTaskExecutor gradingAiProviderTaskExecutor() {',
'        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();',
'        executor.setThreadNamePrefix("mindmark-grading-ai-provider-");',
'        executor.setCorePoolSize(2);',
'        executor.setMaxPoolSize(8);',
'        executor.setQueueCapacity(200);',
'        executor.setWaitForTasksToCompleteOnShutdown(false);',
'        executor.initialize();',
'        return executor;',
'    }',
'',
'    @Bean(name = "gradingAiTaskExecutor")'
].join('\n'));
}
fs.writeFileSync(path, s, 'utf8');
