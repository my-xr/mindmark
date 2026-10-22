const fs = require('fs');
const path = 'apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
let s = fs.readFileSync(path, 'utf8');
if (!s.includes('/api/v1/teacher/dashboard:')) {
  s = s.replace('.contains("/api/v1/classes:")', '.contains("/api/v1/teacher/dashboard:")\n            .contains("TeacherDashboardResponse:")\n            .contains("TeacherDashboardMetric:")\n            .contains("TeacherDashboardTask:")\n            .contains("/api/v1/classes:")');
}
fs.writeFileSync(path, s, 'utf8');
