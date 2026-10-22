const fs=require('fs'); const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/LangGraphQuestionGenerationService.java'; let s=fs.readFileSync(p,'utf8');
s=s.replace('import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;\n', 'import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;\nimport com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;\n');
s=s.replace(`        String apiKey = providerSettingService.resolveApiKey(teacherId, provider);
        List<QuestionCreateRequest> generatedQuestions = aiClient.generate(provider, apiKey, course, request);`, `        AiProviderRuntimeConfig config = providerSettingService.resolveRuntimeConfig(teacherId, provider);
        List<QuestionCreateRequest> generatedQuestions = aiClient.generate(config, course, request);`);
fs.writeFileSync(p,s,'utf8');
