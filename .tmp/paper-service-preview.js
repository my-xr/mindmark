const fs=require('fs');
const path='apps/mindmark-web/src/services/paperService.ts';
let text=fs.readFileSync(path,'utf8');
text=text.replace('  PaperComposeRequest,\n  PaperComposeResult,', '  PaperComposePreview,\n  PaperComposeRequest,\n  PaperComposeResult,');
if(!text.includes('const questionTypeLabelMap')){
const marker='const shuffleQuestions = (items: Question[]) => [...items].sort(() => Math.random() - 0.5);\n\n';
const helpers=`const questionTypeLabelMap: Record<string, string> = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  TRUE_FALSE: '判断题',
  FILL_BLANK: '填空题',
  SHORT_ANSWER: '简答题',
  PROGRAMMING: '编程题',
};

const difficultyLabelMap: Record<string, string> = {
  VERY_EASY: '很简单',
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
  VERY_HARD: '很困难',
};

const buildDistribution = (
  items: PaperQuestion[],
  keyGetter: (item: PaperQuestion) => string[],
  labelGetter: (key: string) => string,
  totalScore: number,
) => {
  const map = new Map<string, { count: number; score: number }>();
  items.forEach((item) => {
    const keys = keyGetter(item);
    keys.forEach((key) => {
      const current = map.get(key) ?? { count: 0, score: 0 };
      current.count += 1;
      current.score += Number(item.score || 0);
      map.set(key, current);
    });
  });

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: labelGetter(key),
      count: value.count,
      score: Number(value.score.toFixed(1)),
      percentage: totalScore > 0 ? Number(((value.score / totalScore) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.score - left.score);
};

const buildMockQualityReport = (items: PaperQuestion[], targetScore: number) => {
  const actualScore = Number(items.reduce((total, item) => total + Number(item.score || 0), 0).toFixed(1));
  const knowledgePointCount = new Set(
    items.flatMap((item) => item.question.knowledgePoints ?? []).filter(Boolean),
  ).size;
  const typeDistribution = buildDistribution(
    items,
    (item) => [item.question.type],
    (key) => questionTypeLabelMap[key] ?? key,
    actualScore,
  );
  const difficultyDistribution = buildDistribution(
    items,
    (item) => [item.question.difficulty],
    (key) => difficultyLabelMap[key] ?? key,
    actualScore,
  );
  const knowledgePointDistribution = buildDistribution(
    items,
    (item) => (item.question.knowledgePoints.length ? item.question.knowledgePoints : ['未标注']),
    (key) => key,
    actualScore,
  ).slice(0, 8);
  const highlights: string[] = [];
  const risks: string[] = [];
  if (actualScore === targetScore) highlights.push('总分与目标分一致，满足基础分值要求。');
  else risks.push(\`当前总分 \${actualScore} 分，与目标 \${targetScore} 分不一致。\`);
  if (typeDistribution.length >= 4) highlights.push('题型覆盖较完整。');
  else risks.push('题型覆盖偏少，建议补充客观题与主观题。');
  if (knowledgePointCount >= 5) highlights.push(\`知识点覆盖达到 \${knowledgePointCount} 个。\`);
  else risks.push(\`知识点覆盖仅 \${knowledgePointCount} 个，建议补充章节覆盖。\`);

  return {
    targetScore,
    actualScore,
    totalQuestionCount: items.length,
    knowledgePointCount,
    typeDistribution,
    difficultyDistribution,
    knowledgePointDistribution,
    highlights,
    risks,
  };
};

const buildMockAgentPlan = (
  strategy: PaperComposeStrategy,
  mode: PaperComposeRequest['mode'],
  report: ReturnType<typeof buildMockQualityReport>,
) => ({
  workflow: 'paper_compose_plan:mock(normalize_rules -> analyze_quality -> build_plan)',
  summary: \`\${strategy === 'AGENT' ? '智能均衡组卷' : '随机组卷'}计划已生成，写入方式为“\${mode === 'REPLACE' ? '替换当前试题' : '追加到当前试题'}”。\`,
  steps: ['读取组卷规则', '筛选当前课程 ACTIVE 题库', '校验库存与总分', '生成质量报告', '后端写入'],
  rationale: report.typeDistribution.map((item) => \`\${item.label}：\${item.count} 道 / \${item.score} 分\`),
  recommendations: report.risks.length ? report.risks : ['建议发布前复核主观题评分点。'],
});

`;
text=text.replace(marker, marker+helpers);
}
text=text.replace(`    gaps: [],
    warnings: [strategy === 'AGENT' ? '模拟智能组卷已完成。' : '模拟随机组卷已完成。'],
  };`, `    gaps: [],
    warnings: [strategy === 'AGENT' ? '模拟智能组卷已完成。' : '模拟随机组卷已完成。'],
    qualityReport: buildMockQualityReport(nextPaper.questions, request.targetScore),
    agentPlan: buildMockAgentPlan(
      strategy,
      request.mode,
      buildMockQualityReport(nextPaper.questions, request.targetScore),
    ),
  };`);
if(!text.includes('previewComposePaperAgent')){
const marker='export async function updatePaperStatus(paperId: string, status: PaperStatus): Promise<Paper[]> {';
const funcs=`const runMockComposePreview = (
  paperId: string,
  request: PaperComposeRequest,
  strategy: PaperComposeStrategy,
): PaperComposePreview => {
  const original = papers.find((item) => item.id === paperId);
  if (!original) {
    throw new Error('试卷不存在');
  }
  const snapshot = papers;
  const result = runMockCompose(paperId, request, strategy);
  papers = snapshot;
  const currentScore = request.mode === 'APPEND' ? original.totalScore : 0;

  return {
    paperId,
    mode: request.mode,
    strategy,
    targetScore: request.targetScore,
    currentScore,
    plannedAddedScore: result.addedScore,
    plannedFinalScore: currentScore + result.addedScore,
    plannedAddedCount: result.addedCount,
    ready: result.gaps.length === 0,
    gaps: result.gaps,
    warnings: result.warnings,
    qualityReport: result.qualityReport,
    agentPlan: result.agentPlan,
  };
};

export async function previewComposePaperRandom(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposePreview> {
  if (!useMockApi) {
    return apiPost<PaperComposePreview, PaperComposeRequest>(
      \`/v1/papers/\${paperId}/compose/random/preview\`,
      request,
    );
  }

  return mockDelay(runMockComposePreview(paperId, request, 'RANDOM'));
}

export async function previewComposePaperAgent(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposePreview> {
  if (!useMockApi) {
    return apiPost<PaperComposePreview, PaperComposeRequest>(
      \`/v1/papers/\${paperId}/compose/agent/preview\`,
      request,
    );
  }

  return mockDelay(runMockComposePreview(paperId, request, 'AGENT'));
}

`;
text=text.replace(marker, funcs+marker);
}
fs.writeFileSync(path,text,'utf8');
