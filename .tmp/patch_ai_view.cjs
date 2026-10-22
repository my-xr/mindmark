const fs=require('fs'); const p='apps/mindmark-web/src/views/teacher/AiQuestionsView.vue'; let s=fs.readFileSync(p,'utf8');
s=s.replace(`  generateAiQuestions,
  getAiProviderSetting,
  listAiQuestionDrafts,
  reviewAiQuestion,
  saveAiProviderSetting,
  type AiProvider,
  type AiProviderSetting,
`, `  generateAiQuestions,
  listAiQuestionDrafts,
  providerLabels,
  reviewAiQuestion,
  type AiProvider,
`);
s=s.replace(/const providerOptions:[\s\S]*?\];\n\nconst form/, `const providerOptions: Array<{ value: AiProvider; label: string; description: string }> = [
  { value: 'OPENAI', label: 'OpenAI', description: '兼容 OpenAI Chat Completions 协议' },
  { value: 'ANTHROPIC', label: 'Anthropic', description: 'Claude Messages API' },
];

const form`);
s=s.replace(/const selectedProviderOption = computed\([\s\S]*?\);\n/, `const selectedProviderOption = computed(() => providerOptions.find((option) => option.value === selectedProvider.value) ?? providerOptions[0]);
`);
s=s.replace(/const providerSetting = ref<AiProviderSetting \| null>\(null\);\nconst providerApiKey = ref\(''\);\nconst providerSaving = ref\(false\);\nconst providerMessage = ref<string \| null>\(null\);\n/, '');
s=s.replace(/const loadProviderSetting = async \(\) => \{[\s\S]*?\};\n\nconst saveProvider = async \(\) => \{[\s\S]*?\n\};\n\n/, '');
s=s.replace(/watch\(\n  \(\) => form\.provider,[\s\S]*?\n\);\n\n/, '');
s=s.replace(`  void loadDrafts();
  void loadProviderSetting();`, `  void loadDrafts();`);
s=s.replace(/\n    <section class="content-card ai-provider-card">[\s\S]*?    <\/section>\n\n    <section class="filter-card filter-card--compact ai-generate-form">/, `
    <section class="filter-card filter-card--compact ai-generate-form">`);
s=s.replace(`            选择课程、Provider、知识点、题型、难度与数量，生成内容强制要求中文。`, `            选择课程、Provider、知识点、题型、难度与数量，生成内容强制要求中文。Provider 服务器地址、模型与 Key 请在个人配置中维护。`);
s=s.replace(`<RouterLink class="secondary-button" to="/teacher/questions">返回题库管理</RouterLink>`, `<RouterLink class="secondary-button" to="/teacher/settings">个人配置</RouterLink>
        <RouterLink class="secondary-button" to="/teacher/questions">返回题库管理</RouterLink>`);
fs.writeFileSync(p,s,'utf8');
