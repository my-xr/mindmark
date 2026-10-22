from pathlib import Path
p=Path('apps/mindmark-web/src/components/common/AppFormControl.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("const attrs = useAttrs();\n\nconst normalizedValue", "const attrs = useAttrs();\nconst forwardedAttrs = computed(() => {\n  const rest = { ...attrs };\n  delete rest.class;\n\n  return rest;\n});\nconst rootClasses = computed(() => ['app-form-control', attrs.class]);\n\nconst normalizedValue")
s=s.replace('<label class="app-form-control">', '<label :class="rootClasses">')
s=s.replace('v-bind="attrs"', 'v-bind="forwardedAttrs"')
p.write_text(s, encoding='utf-8')
