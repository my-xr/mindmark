const fs = require('fs');
const path = 'apps/mindmark-server/openapi/mindmark-api.yaml';
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('  - name: Dashboard')) {
  s = s.replace('  - name: Academic\n', '  - name: Academic\n  - name: Dashboard\n');
}
const dashboardPath = `  /api/v1/teacher/dashboard:
    get:
      tags: [Dashboard]
      summary: Get teacher first-screen dashboard aggregate
      description: Returns metrics and top-priority tasks from database-level paged/count queries to avoid front-end fan-out and full-list aggregation.
      responses:
        '200':
          description: Teacher dashboard aggregate
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeacherDashboardResponse'
`;
if (!s.includes('/api/v1/teacher/dashboard:')) {
  s = s.replace('  /api/v1/auth/login:\n', dashboardPath + '  /api/v1/auth/login:\n');
}
const dashboardSchemas = `    TeacherDashboardMetric:
      type: object
      properties:
        label: { type: string }
        value: { type: string }
        hint: { type: string }
    TeacherDashboardTask:
      type: object
      properties:
        name: { type: string }
        meta: { type: string }
        status: { type: string }
        tone: { type: string, enum: [default, info, processing, success, warning, danger] }
        to: { type: string }
    TeacherDashboard:
      type: object
      properties:
        metrics:
          type: array
          items: { $ref: '#/components/schemas/TeacherDashboardMetric' }
        tasks:
          type: array
          items: { $ref: '#/components/schemas/TeacherDashboardTask' }
    TeacherDashboardResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/TeacherDashboard' }
`;
if (!s.includes('TeacherDashboardResponse:')) {
  s = s.replace('    AdminUser:\n', dashboardSchemas + '    AdminUser:\n');
}
fs.writeFileSync(path, s.replace(/\n/g, '\r\n'), 'utf8');
