from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("import AppActionButton from '@/components/common/AppActionButton.vue';", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport AppChoiceChips from '@/components/common/AppChoiceChips.vue';\nimport AppFormControl from '@/components/common/AppFormControl.vue';")
old = """const difficultyOptions: Array<{ label: string; value: Difficulty }> = [
  { label: '1 易', value: 'VERY_EASY' },
  { label: '2 较易', value: 'EASY' },
  { label: '3 中', value: 'MEDIUM' },
  { label: '4 较难', value: 'HARD' },
  { label: '5 难', value: 'VERY_HARD' },
];
"""
new = old + """
const composeModeOptions: Array<{ label: string; value: PaperComposeMode }> = [
  { label: '替换当前试题', value: 'REPLACE' },
  { label: '追加到当前试题', value: 'APPEND' },
];
"""
s=s.replace(old,new)
old2 = """const buildComposeRequest = (): PaperComposeRequest => ({
  targetScore: Number(composeTargetScore.value),
  mode: composeMode.value,
  rules: toComposeRules(),
});
"""
new2 = old2 + """
const updateRuleDifficulties = (rule: ComposeRuleForm, values: string[]) => {
  rule.difficulties = values.filter((value): value is Difficulty =>
    difficultyOptions.some((option) => option.value === value),
  );
};
"""
s=s.replace(old2,new2)
p.write_text(s, encoding='utf-8')
