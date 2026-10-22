from pathlib import Path
path = Path('apps/mindmark-web/src/components/common/AppActionButton.vue')
text = path.read_text(encoding='utf-8')
text = text.replace("    icon?: string;\n    loading?: boolean;", "    icon?: string;\n    iconOnly?: boolean;\n    loading?: boolean;")
text = text.replace("    icon: '',\n    loading: false,", "    icon: '',\n    iconOnly: false,\n    loading: false,")
text = text.replace('<span class="app-action-button__label"><slot /></span>', '<span v-if="!iconOnly" class="app-action-button__label"><slot /></span>')
path.write_text(text, encoding='utf-8')
