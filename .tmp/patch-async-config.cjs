const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/common/config/AsyncConfig.java';
let s=fs.readFileSync(f,'utf8');
if(!s.includes('gradingAiTaskExecutor')){
  const insert=`
    @Bean(name = "gradingAiTaskExecutor")
    public ThreadPoolTaskExecutor gradingAiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("mindmark-grading-ai-");
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(200);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
`;
  s=s.replace('\n    @Override\n    public Executor getAsyncExecutor()', insert+'\n    @Override\n    public Executor getAsyncExecutor()');
}
fs.writeFileSync(f,s,'utf8');