const fs = require('fs');

const patches = [
  'apps/mindmark-web/src/layouts/TeacherLayout.vue',
  'apps/mindmark-web/src/layouts/AdminLayout.vue',
  'apps/mindmark-web/src/views/auth/LoginView.vue',
];

for (const file of patches) {
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes("import logoUrl from '@/assets/mindmark.png';")) {
    source = source.replace(
      "import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';\n",
      "import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';\nimport logoUrl from '@/assets/mindmark.png';\n",
    );
  }
  source = source.replace(
    /<span class="brand-mark">[^<]*<\/span>/,
    '<img class="brand-logo" :src="logoUrl" alt="" />',
  );
  fs.writeFileSync(file, source, 'utf8');
}

const studentFile = 'apps/mindmark-web/src/layouts/StudentLayout.vue';
let student = fs.readFileSync(studentFile, 'utf8');
if (!student.includes("import logoUrl from '@/assets/mindmark.png';")) {
  student = student.replace(
    "import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';\n",
    "import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';\nimport logoUrl from '@/assets/mindmark.png';\n",
  );
}
student = student.replace(
  /<RouterLink class="student-brand" to="\/student\/exams">([\s\S]*?)<\/RouterLink>/,
  '<RouterLink class="student-brand" to="/student/exams">\n        <img class="brand-logo" :src="logoUrl" alt="" />\n        <span>$1</span>\n      </RouterLink>',
);
fs.writeFileSync(studentFile, student, 'utf8');
