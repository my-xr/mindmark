const fs=require('fs'); const p='apps/mindmark-web/src/constants/apiContracts.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace("'auth' | 'question'", "'auth' | 'academic' | 'question'");
if(!s.includes("id: 'visible-class-list'")){
 const block=`  {
    id: 'visible-class-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/classes',
    mockService: 'academicService.listVisibleClasses',
    description: 'List classes visible to the current user and enforce class-level permission boundary.',
    migrationPriority: 'P0',
  },
  {
    id: 'admin-course-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/admin/courses',
    mockService: 'academicService.listAdminCourses',
    description: 'Admin course base data list.',
    migrationPriority: 'P0',
  },
  {
    id: 'admin-class-list',
    domain: 'academic',
    method: 'GET',
    path: '/api/v1/admin/classes',
    mockService: 'academicService.listAdminClasses',
    description: 'Admin teaching class base data list.',
    migrationPriority: 'P0',
  },
`;
 s=s.replace("  {\n    id: 'student-roster-template',", block+"  {\n    id: 'student-roster-template',");
}
s=s.replace('Student exam center list.', 'Student exam center list; student identity is resolved from current login token.');
s=s.replace('Student score feedback list and details.', 'Student score feedback list and details; student identity is resolved from current login token.');
fs.writeFileSync(p,s,'utf8');
