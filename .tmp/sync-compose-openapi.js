const fs = require('fs');
const path = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let text = fs.readFileSync(path, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const block = (s) => s.replace(/\n/g, nl);
const composePaths = block(`  /api/v1/papers/{paperId}/compose/random:
    post:
      tags: [Paper]
      summary: Randomly compose a paper from active course question bank
      description: Uses teacher-defined rules to pick ACTIVE questions from the same course. Supports APPEND or REPLACE and validates target score, inventory, question type, difficulty and knowledge point constraints before writing paper questions.
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
          description: Compose result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaperComposeResultResponse'
  /api/v1/papers/{paperId}/compose/agent:
    post:
      tags: [Paper]
      summary: Intelligently compose a paper from active course question bank
      description: Uses the paper compose agent to balance question selection across difficulty and knowledge point buckets. The agent never writes unchecked data directly; backend validation enforces course scope, ACTIVE status, de-duplication, target score and inventory constraints.
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
          description: Compose result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaperComposeResultResponse'
`);
if (!text.includes('/api/v1/papers/{paperId}/compose/random:')) {
  const marker = block('  /api/v1/papers/{paperId}/questions/{questionId}:\n');
  if (!text.includes(marker)) throw new Error('path marker not found');
  text = text.replace(marker, composePaths + marker);
}
const composeSchemas = block(`    PaperComposeMode:
      type: string
      enum: [APPEND, REPLACE]
      description: APPEND keeps existing paper questions and adds selected questions; REPLACE clears existing paper questions before writing selected questions.
    PaperComposeStrategy:
      type: string
      enum: [RANDOM, AGENT]
    PaperComposeRuleRequest:
      type: object
      required: [type, count, score]
      properties:
        type:
          $ref: '#/components/schemas/QuestionType'
        count:
          type: integer
          minimum: 0
          description: Number of questions to pick for this type.
        score:
          type: number
          minimum: 0.1
          description: Score per question.
        difficulties:
          type: array
          items:
            $ref: '#/components/schemas/Difficulty'
          description: Optional allowed difficulty list. Empty means all difficulties.
        knowledgePoints:
          type: array
          items: { type: string }
          description: Optional allowed knowledge point list. Empty means no knowledge point constraint.
    PaperComposeRequest:
      type: object
      properties:
        targetScore:
          type: number
          minimum: 0.1
          default: 100
        mode:
          $ref: '#/components/schemas/PaperComposeMode'
        rules:
          type: array
          items:
            $ref: '#/components/schemas/PaperComposeRuleRequest'
      description: When rules are omitted, the server applies the default 100-point template: 20 single choice, 10 multiple choice, 10 true/false, 10 fill blank, 4 short answer and 2 programming questions.
    PaperComposeGap:
      type: object
      properties:
        type:
          $ref: '#/components/schemas/QuestionType'
        requiredCount: { type: integer }
        availableCount: { type: integer }
        message: { type: string }
    PaperComposeResult:
      type: object
      properties:
        paper:
          $ref: '#/components/schemas/Paper'
        addedCount: { type: integer }
        addedScore: { type: number }
        targetScore: { type: number }
        actualScore: { type: number }
        mode:
          $ref: '#/components/schemas/PaperComposeMode'
        strategy:
          $ref: '#/components/schemas/PaperComposeStrategy'
        gaps:
          type: array
          items:
            $ref: '#/components/schemas/PaperComposeGap'
        warnings:
          type: array
          items: { type: string }
    PaperComposeResultResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              $ref: '#/components/schemas/PaperComposeResult'
`);
if (!text.includes('    PaperComposeRequest:')) {
  const marker = block('    Exam:\n');
  if (!text.includes(marker)) throw new Error('schema marker not found');
  text = text.replace(marker, composeSchemas + marker);
}
fs.writeFileSync(path, text, { encoding: 'utf8' });
