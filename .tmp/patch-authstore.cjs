const fs = require('fs');
const file = 'apps/mindmark-web/src/stores/authStore.ts';
let s = fs.readFileSync(file, 'utf8');
s = s.replace("studentId: (state): string => state.currentUser?.studentId ?? 'student-001',", "studentId: (state): string => state.currentUser?.studentId ?? '',");
fs.writeFileSync(file, s, 'utf8');
console.log('patched authStore studentId fallback');
