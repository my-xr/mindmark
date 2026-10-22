from pathlib import Path
files = [
'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobProcessor.java',
'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java',
'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java'
]
patterns = ['markSkipped','completeText','timeoutMs','gradeWithProviderConfig','RestClient restClient','process(String jobId)','markRunning','applyResults','catch (RuntimeException','catch (Exception','@Value']
for f in files:
    print('\n---', f)
    s = Path(f).read_text(encoding='utf-8-sig')
    lines = s.splitlines()
    printed = set()
    for i, line in enumerate(lines, 1):
        if any(p in line for p in patterns):
            start=max(1,i-3); end=min(len(lines),i+8)
            key=(start,end)
            if key in printed: continue
            printed.add(key)
            print(f'@@ {start}-{end}')
            for j in range(start,end+1):
                print(f'{j:04d}: {lines[j-1]}')
