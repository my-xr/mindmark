const fs=require('fs');
const path='apps/mindmark-server/openapi/mindmark-api.yaml';
let text=fs.readFileSync(path,'utf8');
const nl=text.includes('\r\n')?'\r\n':'\n';
const b=s=>s.replace(/\n/g,nl);
if(!text.includes('/api/v1/papers/{paperId}/compose/random/preview:')){
  const marker=b('  /api/v1/papers/{paperId}/compose/random:\n');
  const block=b(`  /api/v1/papers/{paperId}/compose/random/preview:
    post:
      tags: [Paper]
      summary: Preview random paper composition quality without writing
      parameters:
        - $ref: '#/components/parameters/PaperId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaperComposeRequest'
      responses:
        '200':
          description: Compose preview result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaperComposePreviewResponse'
  /api/v1/papers/{paperId}/compose/agent/preview:
    post:
      tags: [Paper]
      summary: Preview LangGraph assisted paper composition plan and quality without writing
      description: Runs the composition planning workflow and backend inventory checks, returns quality distribution and agent plan but does not write paper questions.
      parameters:
        - $ref: '#/components/parameters/PaperId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaperComposeRequest'
      responses:
        '200':
          description: Compose preview result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaperComposePreviewResponse'
`);
  if(!text.includes(marker)) throw new Error('preview path marker not found');
  text=text.replace(marker,block+marker);
}
if(!text.includes('PaperComposeQualityReport:')){
  const marker=b('    PaperComposeResult:\n');
  const block=b(`    PaperComposeDistributionItem:
      type: object
      properties:
        key: { type: string }
        label: { type: string }
        count: { type: integer }
        score: { type: number }
        percentage: { type: number }
    PaperComposeQualityReport:
      type: object
      properties:
        targetScore: { type: number }
        actualScore: { type: number }
        totalQuestionCount: { type: integer }
        knowledgePointCount: { type: integer }
        typeDistribution:
          type: array
          items: { $ref: '#/components/schemas/PaperComposeDistributionItem' }
        difficultyDistribution:
          type: array
          items: { $ref: '#/components/schemas/PaperComposeDistributionItem' }
        knowledgePointDistribution:
          type: array
          items: { $ref: '#/components/schemas/PaperComposeDistributionItem' }
        highlights:
          type: array
          items: { type: string }
        risks:
          type: array
          items: { type: string }
    PaperComposeAgentPlan:
      type: object
      properties:
        workflow: { type: string }
        summary: { type: string }
        steps:
          type: array
          items: { type: string }
        rationale:
          type: array
          items: { type: string }
        recommendations:
          type: array
          items: { type: string }
    PaperComposePreview:
      type: object
      properties:
        paperId: { type: string }
        mode:
          $ref: '#/components/schemas/PaperComposeMode'
        strategy:
          $ref: '#/components/schemas/PaperComposeStrategy'
        targetScore: { type: number }
        currentScore: { type: number }
        plannedAddedScore: { type: number }
        plannedFinalScore: { type: number }
        plannedAddedCount: { type: integer }
        ready: { type: boolean }
        gaps:
          type: array
          items: { $ref: '#/components/schemas/PaperComposeGap' }
        warnings:
          type: array
          items: { type: string }
        qualityReport:
          $ref: '#/components/schemas/PaperComposeQualityReport'
        agentPlan:
          $ref: '#/components/schemas/PaperComposeAgentPlan'
    PaperComposePreviewResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              $ref: '#/components/schemas/PaperComposePreview'
`);
  if(!text.includes(marker)) throw new Error('schema marker not found');
  text=text.replace(marker,block+marker);
}
if(!text.includes('qualityReport:\n          $ref')){
  text=text.replace(b(`        warnings:
          type: array
          items: { type: string }
    PaperComposeResultResponse:`), b(`        warnings:
          type: array
          items: { type: string }
        qualityReport:
          $ref: '#/components/schemas/PaperComposeQualityReport'
        agentPlan:
          $ref: '#/components/schemas/PaperComposeAgentPlan'
    PaperComposeResultResponse:`));
}
fs.writeFileSync(path,text,'utf8');
