from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
repls={
'''.enterprise-question-table {
  --table-row-hover: color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card));
}''': '''.enterprise-question-table {
  --table-row-hover: color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card));

  overflow: hidden;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
}''',
'''.enterprise-question-table :deep(.ant-table) {
  color: var(--mm-color-text-primary);
  font-size: 0.82rem;
}''': '''.enterprise-question-table :deep(.ant-table) {
  color: var(--mm-color-text-primary);
  font-size: 0.78rem;
}''',
'''.enterprise-question-table :deep(.ant-table-thead > tr > th) {
  background: color-mix(in srgb, var(--mm-color-primary) 3%, var(--mm-color-card));
  color: var(--mm-color-text-secondary);
  font-size: 0.76rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}''': '''.enterprise-question-table :deep(.ant-table-thead > tr > th) {
  background: color-mix(in srgb, var(--mm-color-primary) 2.5%, var(--mm-color-card));
  color: var(--mm-color-text-secondary);
  font-size: 0.74rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}''',
'''.enterprise-question-table :deep(.ant-table-tbody > tr > td) {
  padding: 10px 12px;
  border-color: var(--mm-color-border);
  vertical-align: middle;
}''': '''.enterprise-question-table :deep(.ant-table-tbody > tr > td) {
  padding: 9px 12px;
  border-color: var(--mm-color-border);
  vertical-align: middle;
}''',
'''.question-title-ellipsis {
  font-weight: 600;
}''': '''.question-title-ellipsis {
  font-weight: 500;
}''',
'''.enterprise-question-table :deep(.ant-pagination) {
  margin: 12px 16px 14px;
}''': '''.enterprise-question-table :deep(.ant-pagination) {
  margin: 12px 14px 14px;
}

.enterprise-question-table :deep(.enterprise-pagination-action) {
  display: inline-grid;
  place-items: center;
  color: var(--mm-color-text-secondary);
  font-size: 0.82rem;
}'''
}
for old,new in repls.items():
    if old not in text: raise SystemExit('missing '+old[:40])
    text=text.replace(old,new)
p.write_text(text,encoding='utf-8')
