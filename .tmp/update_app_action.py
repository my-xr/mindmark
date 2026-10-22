from pathlib import Path
p = Path('apps/mindmark-web/src/components/common/AppActionButton.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import { computed } from 'vue';", "import { computed, useAttrs } from 'vue';")
s = s.replace("const props = withDefaults(", "defineOptions({ inheritAttrs: false });\n\nconst attrs = useAttrs();\n\nconst props = withDefaults(")
s = s.replace("const classes = computed(() => [", "const forwardedAttrs = computed(() => {\n  const { class: _class, ...rest } = attrs;\n\n  return rest;\n});\n\nconst classes = computed(() => [")
s = s.replace("const iconText = computed(() => (props.loading ? '⏳' : props.icon));", "const rootClasses = computed(() => [classes.value, attrs.class]);\nconst iconText = computed(() => (props.loading ? '⏳' : props.icon));")
s = s.replace('    :class="classes"', '    v-bind="forwardedAttrs"\n    :class="rootClasses"')
p.write_text(s, encoding='utf-8')
