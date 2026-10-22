const fs = require('fs');
const p = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('/api/v1/courses:')) {
  s = s.replace(`  /api/v1/admin/courses:\n`, `  /api/v1/courses:\n    get:\n      tags: [Academic]\n      summary: List courses visible to current user\n      description: ADMIN sees all active courses; TEACHER/TA/STUDENT see courses attached to visible classes.\n      responses:\n        '200':\n          description: Visible courses\n          content:\n            application/json:\n              schema:\n                $ref: '#/components/schemas/CourseListResponse'\n  /api/v1/admin/courses:\n`);
}
if (!s.includes('name: courseId')) {
  s = s.replace(`        - name: status\n          in: query\n          schema:\n            type: string\n            enum: [DRAFT, PENDING_REVIEW, ACTIVE, DISABLED]\n        - name: knowledgePoint`, `        - name: status\n          in: query\n          schema:\n            type: string\n            enum: [DRAFT, PENDING_REVIEW, ACTIVE, DISABLED]\n        - name: courseId\n          in: query\n          schema:\n            type: string\n        - name: knowledgePoint`);
}
s = s.replace(`enum: [EASY, MEDIUM, HARD]`, `enum: [VERY_EASY, EASY, MEDIUM, HARD, VERY_HARD]`);
if (!s.includes('courseId: { type: string, nullable: true }')) {
  s = s.replace(`        difficulty: { $ref: '#/components/schemas/Difficulty' }\n        score: { type: number }`, `        difficulty: { $ref: '#/components/schemas/Difficulty' }\n        courseId: { type: string, nullable: true }\n        courseName: { type: string, nullable: true }\n        score: { type: number }`);
}
s = s.replace(`required: [prompt, questionType, difficulty, count]`, `required: [courseId, prompt, questionType, difficulty, count]`);
if (!s.includes('courseId: { type: string, description: Selected course id }')) {
  s = s.replace(`        prompt: { type: string }\n        questionType: { $ref: '#/components/schemas/QuestionType' }`, `        courseId: { type: string, description: Selected course id }\n        prompt: { type: string }\n        questionType: { $ref: '#/components/schemas/QuestionType' }`);
}
fs.writeFileSync(p, s, 'utf8');
