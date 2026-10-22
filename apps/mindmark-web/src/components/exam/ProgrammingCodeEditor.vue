<script setup lang="ts">
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { yaml } from '@codemirror/lang-yaml';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';

import type { ProgrammingLanguage } from '@/types/programming';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
    questionId?: string;
    language?: ProgrammingLanguage;
  }>(),
  {
    disabled: false,
    questionId: '',
    language: 'java',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'language-change': [language: ProgrammingLanguage];
  format: [payload: { language: ProgrammingLanguage; beforeLength: number; afterLength: number }];
}>();

const languageOptions: Array<{ label: string; value: ProgrammingLanguage }> = [
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'YAML / YML', value: 'yml' },
];

const labels = {
  codeArea: '\u4ee3\u7801\u4f5c\u7b54\u533a',
  descriptionPrefix: '\u652f\u6301',
  descriptionSuffix:
    '\u9ad8\u4eae\u4e0e\u4fdd\u5b88\u683c\u5f0f\u5316\uff0c\u8349\u7a3f\u4f1a\u81ea\u52a8\u4fdd\u5b58\u6e90\u7801\u3002',
  language: '\u8bed\u8a00',
  format: '\u683c\u5f0f\u5316',
  lines: '\u884c',
  chars: '\u5b57\u7b26',
  questionNo: '\u9898\u53f7',
  readonly: '\u8fdb\u5165\u5168\u5c4f\u540e\u53ef\u7f16\u8f91',
};

const editorHost = ref<HTMLElement | null>(null);
const editorView = shallowRef<EditorView | null>(null);
const language = ref<ProgrammingLanguage>(props.language);
const languageCompartment = new Compartment();
const editableCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

const isDisabled = computed(() => Boolean(props.disabled));
const currentLanguageLabel = computed(
  () => languageOptions.find((item) => item.value === language.value)?.label ?? 'Java',
);
const lineCount = computed(() => Math.max((props.modelValue || '').split('\n').length, 1));
const charCount = computed(() => (props.modelValue || '').length);

const getLanguageExtension = (value: ProgrammingLanguage): Extension => {
  if (value === 'javascript') {
    return javascript({ jsx: false, typescript: false });
  }
  if (value === 'python') {
    return python();
  }
  if (value === 'yml') {
    return yaml();
  }
  return java();
};

const editorTheme = EditorView.theme({
  '&': {
    minHeight: '320px',
    height: '100%',
    fontSize: '13px',
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--text, #172033)',
  },
  '.cm-scroller': {
    minHeight: '320px',
    maxHeight: '520px',
    overflow: 'auto',
    fontFamily: 'JetBrains Mono, Consolas, SFMono-Regular, monospace',
    lineHeight: '1.65',
  },
  '.cm-content': {
    padding: '14px 0',
  },
  '.cm-line': {
    padding: '0 14px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--surface-muted, #f7f9fc)',
    color: 'var(--text-tertiary, #8a94a6)',
    borderRight: '1px solid var(--border, #e7ebf3)',
  },
  '.cm-activeLineGutter, .cm-activeLine': {
    backgroundColor: 'rgba(64, 128, 255, 0.06)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(64, 128, 255, 0.18)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

const buildExtensions = (): Extension[] => [
  basicSetup,
  EditorView.lineWrapping,
  editorTheme,
  languageCompartment.of(getLanguageExtension(language.value)),
  editableCompartment.of(EditorView.editable.of(!props.disabled)),
  readOnlyCompartment.of(EditorState.readOnly.of(props.disabled)),
  EditorView.updateListener.of((update) => {
    if (!update.docChanged) {
      return;
    }
    emit('update:modelValue', update.state.doc.toString());
  }),
];

const syncEditorValue = (value: string) => {
  const view = editorView.value;
  if (!view || view.state.doc.toString() === value) {
    return;
  }
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
  });
};

const recreateEditor = () => {
  if (!editorHost.value) {
    return;
  }
  editorView.value?.destroy();
  editorView.value = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: props.modelValue || '',
      extensions: buildExtensions(),
    }),
  });
};

const changeLanguage = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  language.value = target.value as ProgrammingLanguage;
};

const cleanLines = (source: string) =>
  source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''));

const collapseBlankLines = (source: string, maxBlankLines = 1) => {
  const result: string[] = [];
  let blankCount = 0;
  cleanLines(source).forEach((line) => {
    if (!line.trim()) {
      blankCount += 1;
      if (blankCount <= maxBlankLines) {
        result.push('');
      }
      return;
    }
    blankCount = 0;
    result.push(line);
  });
  return result.join('\n').trim() + '\n';
};

const splitBraceLanguageStatements = (source: string) => {
  let output = '';
  let quote: 'single' | 'double' | 'template' | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let parenDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      output += char;
      if (char === '\n') {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      output += char;
      if (char === '*' && next === '/') {
        output += next;
        index += 1;
        blockComment = false;
      }
      continue;
    }

    if (quote) {
      output += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (
        (quote === 'single' && char === "'") ||
        (quote === 'double' && char === '"') ||
        (quote === 'template' && char === '`')
      ) {
        quote = null;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      output += char + next;
      index += 1;
      lineComment = true;
      continue;
    }
    if (char === '/' && next === '*') {
      output += char + next;
      index += 1;
      blockComment = true;
      continue;
    }
    if (char === "'") {
      quote = 'single';
      output += char;
      continue;
    }
    if (char === '"') {
      quote = 'double';
      output += char;
      continue;
    }
    if (char === '`') {
      quote = 'template';
      output += char;
      continue;
    }
    if (char === '(' || char === '[') {
      parenDepth += 1;
      output += char;
      continue;
    }
    if (char === ')' || char === ']') {
      parenDepth = Math.max(parenDepth - 1, 0);
      output += char;
      continue;
    }
    if (char === '{') {
      output = output.replace(/[ \t]*$/g, '');
      output += ' {\n';
      continue;
    }
    if (char === '}') {
      output = output.replace(/[ \t]*$/g, '');
      if (!output.endsWith('\n')) {
        output += '\n';
      }
      output += '}\n';
      continue;
    }
    if (char === ';' && parenDepth === 0) {
      output += ';\n';
      continue;
    }
    output += char;
  }

  return output;
};

const formatBraceLanguage = (source: string) => {
  const prepared = splitBraceLanguageStatements(source);
  const lines = cleanLines(prepared)
    .map((line) => line.trim())
    .filter((line, index, lines) => line || lines[index - 1]);
  const result: string[] = [];
  let indent = 0;

  lines.forEach((line) => {
    if (!line) {
      result.push('');
      return;
    }
    if (line.startsWith('}') || line.startsWith(']')) {
      indent = Math.max(indent - 1, 0);
    }
    result.push('  '.repeat(indent) + line);
    if (line.endsWith('{')) {
      indent += 1;
    }
  });

  return (
    result
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
};

const formatYaml = (source: string) =>
  collapseBlankLines(
    cleanLines(source)
      .map((line) => line.replace(/\t/g, '  '))
      .join('\n'),
    1,
  );

const formatByLanguage = (source: string, value: ProgrammingLanguage) => {
  if (!source.trim()) {
    return '';
  }
  if (value === 'java' || value === 'javascript') {
    return formatBraceLanguage(source);
  }
  if (value === 'yml') {
    return formatYaml(source);
  }
  return collapseBlankLines(source, 2);
};

const formatCode = () => {
  const view = editorView.value;
  if (!view || props.disabled) {
    return;
  }
  const before = view.state.doc.toString();
  const after = formatByLanguage(before, language.value);
  if (before === after) {
    return;
  }
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: after },
  });
  emit('update:modelValue', after);
  emit('format', {
    language: language.value,
    beforeLength: before.length,
    afterLength: after.length,
  });
  void nextTick(() => view.focus());
};

onMounted(recreateEditor);
onBeforeUnmount(() => editorView.value?.destroy());

watch(
  () => props.modelValue,
  (value) => syncEditorValue(value || ''),
);

watch(
  () => props.language,
  (value) => {
    if (value !== language.value) {
      language.value = value;
    }
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    const view = editorView.value;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: [
        editableCompartment.reconfigure(EditorView.editable.of(!disabled)),
        readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled)),
      ],
    });
  },
);

watch(language, (value) => {
  const view = editorView.value;
  if (view) {
    view.dispatch({ effects: languageCompartment.reconfigure(getLanguageExtension(value)) });
  }
  emit('language-change', value);
});
</script>

<template>
  <section class="programming-editor" :class="{ 'programming-editor--disabled': isDisabled }">
    <header class="programming-editor__toolbar">
      <div class="programming-editor__identity">
        <span class="programming-editor__icon">&lt;/&gt;</span>
        <div>
          <strong>{{ labels.codeArea }}</strong>
          <p>
            {{ labels.descriptionPrefix }} {{ currentLanguageLabel }}
            {{ labels.descriptionSuffix }}
          </p>
        </div>
      </div>
      <div class="programming-editor__actions">
        <label class="programming-editor__language">
          <span>{{ labels.language }}</span>
          <select :value="language" :disabled="isDisabled" @change="changeLanguage">
            <option v-for="item in languageOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </label>
        <AppActionButton :disabled="isDisabled" @click="formatCode">
          {{ labels.format }}
        </AppActionButton>
      </div>
    </header>

    <div ref="editorHost" class="programming-editor__surface" />

    <footer class="programming-editor__footer">
      <span>{{ lineCount }} {{ labels.lines }}</span>
      <span>{{ charCount }} {{ labels.chars }}</span>
      <span v-if="questionId">{{ labels.questionNo }}: {{ questionId }}</span>
      <span v-if="isDisabled" class="programming-editor__readonly">{{ labels.readonly }}</span>
    </footer>
  </section>
</template>
