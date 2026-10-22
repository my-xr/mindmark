const fs=require('fs');
const p='apps/mindmark-server/openapi/mindmark-api.yaml';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');

// Add GET to paper questions path before existing POST.
s=s.replace(`  /api/v1/papers/{paperId}/questions:
    post:
`, `  /api/v1/papers/{paperId}/questions:
    get:
      tags: [Paper]
      summary: List selected questions in a paper with database pagination
      parameters:
        - $ref: '#/components/parameters/PaperId'
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/PageSize'
      responses:
        '200':
          description: Paper question page
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaperQuestionPageResponse'
    post:
`);

// Exam list parameters description and keep schema name.
s=s.replace(`  /api/v1/exams:
    get:
      tags: [Exam]
      summary: List exams for teacher workspace
      responses:
`, `  /api/v1/exams:
    get:
      tags: [Exam]
      summary: List exams for teacher workspace
      parameters:
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/PageSize'
      responses:
`);

// Add security events path if missing.
if(!s.includes('/api/v1/exams/{examId}/security-events:')){
  s=s.replace(`  /api/v1/exams/{examId}/scores:
`, `  /api/v1/exams/{examId}/security-events:
    get:
      tags: [Audit]
      summary: List exam security events with database pagination
      parameters:
        - $ref: '#/components/parameters/ExamId'
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/PageSize'
      responses:
        '200':
          description: Security event page
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExamSecurityEventPageResponse'
    post:
      tags: [Audit]
      summary: Report a student-side security event
      parameters:
        - $ref: '#/components/parameters/ExamId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExamSecurityEventReportRequest'
      responses:
        '200':
          description: Created security event
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExamSecurityEventResponse'
  /api/v1/exams/{examId}/scores:
`);
}

// Add PaperQuestionPageResponse schema after PaperPageResponse block.
if(!s.includes('PaperQuestionPageResponse:')){
  s=s.replace(`    PaperResponse:
      allOf:
`, `    PaperQuestionPageResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              allOf:
                - $ref: '#/components/schemas/PageResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items: { $ref: '#/components/schemas/PaperQuestion' }
    PaperResponse:
      allOf:
`);
}

// Make ExamListResponse a page response.
s=s.replace(/    ExamListResponse:\n      allOf:\n        - \$ref: '#\/components\/schemas\/ApiResponse'\n        - type: object\n          properties:\n            data:\n              type: array\n              items: \{ \$ref: '#\/components\/schemas\/Exam' \}/, `    ExamListResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              allOf:
                - $ref: '#/components/schemas/PageResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items: { $ref: '#/components/schemas/Exam' }`);

// Add security event schemas before StudentExamListResponse.
if(!s.includes('ExamSecurityEvent:')){
  s=s.replace(`    StudentExamListResponse:
`, `    ExamSecurityEventType:
      type: string
      enum: [VISIBILITY_HIDDEN, WINDOW_BLUR, FULLSCREEN_EXIT, AUTO_SUBMIT, MANUAL_REPORT]
    ExamSecuritySeverity:
      type: string
      enum: [LOW, MEDIUM, HIGH]
    ExamSecurityEvent:
      type: object
      properties:
        id: { type: string }
        examId: { type: string }
        answerSheetId: { type: string }
        studentId: { type: string }
        studentName: { type: string }
        eventType: { $ref: '#/components/schemas/ExamSecurityEventType' }
        severity: { $ref: '#/components/schemas/ExamSecuritySeverity' }
        message: { type: string, nullable: true }
        clientEventCount: { type: integer }
        clientOccurredAt: { type: string, format: date-time, nullable: true }
        serverReceivedAt: { type: string, format: date-time }
        userAgent: { type: string, nullable: true }
    ExamSecurityEventReportRequest:
      type: object
      required: [eventType]
      properties:
        eventType: { $ref: '#/components/schemas/ExamSecurityEventType' }
        message: { type: string, nullable: true }
        clientEventCount: { type: integer, minimum: 1, nullable: true }
        clientOccurredAt: { type: string, format: date-time, nullable: true }
    ExamSecurityEventResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/ExamSecurityEvent' }
    ExamSecurityEventPageResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              allOf:
                - $ref: '#/components/schemas/PageResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items: { $ref: '#/components/schemas/ExamSecurityEvent' }
    StudentExamListResponse:
`);
}

fs.writeFileSync(p,s,'utf8');
