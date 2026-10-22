const fs=require('fs');
const path='apps/mindmark-web/src/views/teacher/PapersView.vue';
let text=fs.readFileSync(path,'utf8');
text=text.replace('  listPapersPage,\n  removeQuestionFromPaper,', '  listPapersPage,\n  previewComposePaperAgent,\n  previewComposePaperRandom,\n  removeQuestionFromPaper,');
text=text.replace('import type { Paper, PaperComposeMode, PaperComposeRule, PaperQuestion } from \'@/types/paper\';', 'import type {\n  Paper,\n  PaperComposeMode,\n  PaperComposePreview,\n  PaperComposeRequest,\n  PaperComposeRule,\n  PaperQuestion,\n} from \'@/types/paper\';');
if(!text.includes('composePreviewLoading')){
text=text.replace('const composeTargetScore = ref(100);\n', 'const composeTargetScore = ref(100);\nconst composePreview = ref<PaperComposePreview | null>(null);\nconst composePreviewLoading = ref(false);\n');
}
text=text.replace('  void loadSelectedPaperRelated();\n};', '  composePreview.value = null;\n  void loadSelectedPaperRelated();\n};');
text=text.replace('  composeRules.splice(0, composeRules.length, ...createDefaultComposeRules());\n};', '  composeRules.splice(0, composeRules.length, ...createDefaultComposeRules());\n  composePreview.value = null;\n};');
text=text.replace('const toComposeRequest = (): PaperComposeRule[] =>', 'const toComposeRules = (): PaperComposeRule[] =>');
text=text.replace('      rules: toComposeRequest(),', '      rules: toComposeRules(),');
if(!text.includes('const buildComposeRequest')){
text=text.replace(`const toComposeRules = (): PaperComposeRule[] =>
  composeRules
    .filter((rule) => Number(rule.count) > 0)
    .map((rule) => ({
      type: rule.type,
      count: Number(rule.count),
      score: Number(rule.score),
      difficulties: [...rule.difficulties],
      knowledgePoints: parseKnowledgePoints(rule.knowledgeText),
    }));

`, `const toComposeRules = (): PaperComposeRule[] =>
  composeRules
    .filter((rule) => Number(rule.count) > 0)
    .map((rule) => ({
      type: rule.type,
      count: Number(rule.count),
      score: Number(rule.score),
      difficulties: [...rule.difficulties],
      knowledgePoints: parseKnowledgePoints(rule.knowledgeText),
    }));

const buildComposeRequest = (): PaperComposeRequest => ({
  targetScore: Number(composeTargetScore.value),
  mode: composeMode.value,
  rules: toComposeRules(),
});

const previewComposeQuality = async (strategy: 'random' | 'agent' = 'agent') => {
  if (!selectedPaper.value) {
    return;
  }

  composePreviewLoading.value = true;
  errorMessage.value = null;
  try {
    composePreview.value =
      strategy === 'agent'
        ? await previewComposePaperAgent(selectedPaper.value.id, buildComposeRequest())
        : await previewComposePaperRandom(selectedPaper.value.id, buildComposeRequest());
    operationMessage.value = '组卷质量预览已更新，可检查题型、难度和知识点覆盖后再写入试卷。';
  } catch (error) {
    composePreview.value = null;
    errorMessage.value = getErrorMessage(error, '组卷预览失败，请检查题库库存、难度和知识点规则');
  } finally {
    composePreviewLoading.value = false;
  }
};

`);
}
text=text.replace(`    const request = {
      targetScore: Number(composeTargetScore.value),
      mode: composeMode.value,
      rules: toComposeRules(),
    };`, '    const request = buildComposeRequest();');
text=text.replace('    selectedPaperId.value = result.paper.id;\n', '    composePreview.value = {\n      paperId: result.paper.id,\n      mode: result.mode,\n      strategy: result.strategy,\n      targetScore: result.targetScore,\n      currentScore: composeMode.value === \'APPEND\' ? Number(selectedPaper.value?.totalScore ?? 0) : 0,\n      plannedAddedScore: result.addedScore,\n      plannedFinalScore: result.actualScore,\n      plannedAddedCount: result.addedCount,\n      ready: result.gaps.length === 0,\n      gaps: result.gaps,\n      warnings: result.warnings,\n      qualityReport: result.qualityReport,\n      agentPlan: result.agentPlan,\n    };\n    selectedPaperId.value = result.paper.id;\n');
fs.writeFileSync(path,text,'utf8');
