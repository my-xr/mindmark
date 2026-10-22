from pathlib import Path
p=Path('apps/mindmark-web/src/components/common/AppActionButton.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("const forwardedAttrs = computed(() => {\n  const { class: _class, ...rest } = attrs;\n\n  return rest;\n});", "const forwardedAttrs = computed(() => {\n  const rest = { ...attrs };\n  delete rest.class;\n\n  return rest;\n});")
p.write_text(s, encoding='utf-8')

p=Path('apps/mindmark-web/src/views/auth/LoginView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("import { RouterLink, useRouter } from 'vue-router';", "import { useRouter } from 'vue-router';")
p.write_text(s, encoding='utf-8')
