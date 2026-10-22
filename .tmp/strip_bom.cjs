const fs=require('fs');
for (const p of [
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiProviderSettingService.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingRequest.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingResponse.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderRuntimeConfig.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/domain/AiProviderSettingEntity.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java',
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/LangGraphQuestionGenerationService.java'
]) {
  const s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/, '');
  fs.writeFileSync(p,s,'utf8');
}
