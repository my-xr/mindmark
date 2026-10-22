const fs = require('fs');
const p = 'apps/mindmark-web/src/views/admin/UsersView.vue';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes("@/services/academicService")) {
  s = s.replace("import StatusTag from '@/components/common/StatusTag.vue';\n", "import StatusTag from '@/components/common/StatusTag.vue';\nimport { listVisibleClasses } from '@/services/academicService';\n");
  s = s.replace("import type { RoleCode, UserStatus } from '@/types/user';", "import type { TeachingClass } from '@/types/academic';\nimport type { RoleCode, UserStatus } from '@/types/user';");
}
s = s.replace("const assignments = ref<ClassAssignment[]>([]);\nconst assignmentForm", "const assignments = ref<ClassAssignment[]>([]);\nconst classes = ref<TeachingClass[]>([]);\nconst assignmentForm");
s = s.replace("classId: 'class-demo-001',", "classId: '',");
if (!s.includes('const classLabel = (classId: string) =>')) {
  const insert = "const isLocked = (user: AdminUser) =>\n  Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());\n\n" +
"const classLabel = (classId: string) => {\n" +
"  const teachingClass = classes.value.find((item) => item.id === classId);\n" +
"  return teachingClass ? `${teachingClass.name} / ${teachingClass.code}` : classId;\n" +
"};\n\n" +
"const loadClasses = async () => {\n" +
"  try {\n" +
"    classes.value = await listVisibleClasses();\n" +
"    assignmentForm.value.classId = assignmentForm.value.classId || classes.value[0]?.id || '';\n" +
"  } catch (error) {\n" +
"    errorMessage.value = error instanceof Error ? error.message : '班级列表加载失败';\n" +
"  }\n" +
"};\n\n";
  s = s.replace("const isLocked = (user: AdminUser) =>\n  Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());\n\n", insert);
}
s = s.replace("if (!selectedUser.value || !assignmentForm.value.classId.trim()) {", "if (!selectedUser.value || !assignmentForm.value.classId) {");
s = s.replace("errorMessage.value = '请选择用户并填写班级 ID';", "errorMessage.value = '请选择用户并选择教学班';");
s = s.replace("assignmentForm.value.classId.trim(),", "assignmentForm.value.classId,");
s = s.replace("onMounted(async () => {\n  await loadUsers();\n  await loadAudits();\n});", "onMounted(async () => {\n  await Promise.all([loadClasses(), loadUsers(), loadAudits()]);\n});");
s = s.replace(`            <label class="form-field">
              班级 ID
              <input
                v-model.trim="assignmentForm.classId"
                class="text-input"
                placeholder="class-demo-001"
              />
            </label>`, `            <label class="form-field">
              教学班
              <select v-model="assignmentForm.classId" class="text-input">
                <option value="">请选择教学班</option>
                <option v-for="teachingClass in classes" :key="teachingClass.id" :value="teachingClass.id">
                  {{ teachingClass.name }} / {{ teachingClass.code }}
                </option>
              </select>
            </label>`);
s = s.replace('<span>{{ assignment.classId }}</span>', '<span>{{ classLabel(assignment.classId) }}</span>');
fs.writeFileSync(p, s, 'utf8');
