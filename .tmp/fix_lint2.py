from pathlib import Path
p = Path('apps/mindmark-web/src/views/auth/LoginView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace("import { RouterLink, useRoute, useRouter } from 'vue-router';", "import { useRoute, useRouter } from 'vue-router';")
p.write_text(s, encoding='utf-8')

p = Path('apps/mindmark-web/src/components/admin/AdminUserSection.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('''          <AppActionButton
            variant="danger"
            v-if="user.status === 'ACTIVE'"''', '''          <AppActionButton
            v-if="user.status === 'ACTIVE'"
            variant="danger"''')
p.write_text(s, encoding='utf-8')
