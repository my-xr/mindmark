const fs = require('fs');
const p = 'apps/mindmark-server/src/test/java/com/mindmark/server/OpenApiContractTests.java';
let s = fs.readFileSync(p, 'utf8');
const anchor = '            .contains("/api/v1/student-roster-template:")';
if (!s.includes('/api/v1/admin/courses:')) {
  s = s.replace(anchor, `            .contains("/api/v1/classes:")\n            .contains("/api/v1/admin/courses:")\n            .contains("/api/v1/admin/courses/{courseId}:")\n            .contains("/api/v1/admin/classes:")\n            .contains("/api/v1/admin/classes/{classId}:")\n            .contains("CourseRequest:")\n            .contains("CourseResponse:")\n            .contains("TeachingClassRequest:")\n            .contains("TeachingClassResponse:")\n${anchor}`);
}
fs.writeFileSync(p, s, 'utf8');
