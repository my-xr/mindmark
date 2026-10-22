const fs = require('fs');
const path='apps/mindmark-web/src/types/paper.ts';
let text=fs.readFileSync(path,'utf8');
if(!text.includes('export interface PaperComposeDistributionItem')){
text=text.replace(`export interface PaperComposeGap {
  type: QuestionType;
  requiredCount: number;
  availableCount: number;
  knowledgePoints: string[];
  message: string;
}

`, `export interface PaperComposeGap {
  type: QuestionType;
  requiredCount: number;
  availableCount: number;
  knowledgePoints: string[];
  message: string;
}

export interface PaperComposeDistributionItem {
  key: string;
  label: string;
  count: number;
  score: number;
  percentage: number;
}

export interface PaperComposeQualityReport {
  targetScore: number;
  actualScore: number;
  totalQuestionCount: number;
  knowledgePointCount: number;
  typeDistribution: PaperComposeDistributionItem[];
  difficultyDistribution: PaperComposeDistributionItem[];
  knowledgePointDistribution: PaperComposeDistributionItem[];
  highlights: string[];
  risks: string[];
}

export interface PaperComposeAgentPlan {
  workflow: string;
  summary: string;
  steps: string[];
  rationale: string[];
  recommendations: string[];
}

export interface PaperComposePreview {
  paperId: string;
  mode: PaperComposeMode;
  strategy: PaperComposeStrategy;
  targetScore: number;
  currentScore: number;
  plannedAddedScore: number;
  plannedFinalScore: number;
  plannedAddedCount: number;
  ready: boolean;
  gaps: PaperComposeGap[];
  warnings: string[];
  qualityReport: PaperComposeQualityReport;
  agentPlan: PaperComposeAgentPlan;
}

`);
text=text.replace(`  gaps: PaperComposeGap[];
  warnings: string[];
}`, `  gaps: PaperComposeGap[];
  warnings: string[];
  qualityReport: PaperComposeQualityReport;
  agentPlan: PaperComposeAgentPlan;
}`);
}
fs.writeFileSync(path,text,'utf8');
