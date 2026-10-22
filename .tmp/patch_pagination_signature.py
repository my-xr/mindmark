from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
old="""const renderPaginationItem = (page: number, type: string, originalElement: unknown) => {
  if (type === 'page') {"""
new="""const renderPaginationItem = ({
  page,
  type,
  originalElement,
}: {
  page: number;
  type: 'next' | 'page' | 'prev' | 'jump-prev' | 'jump-next';
  originalElement: unknown;
}) => {
  if (type === 'page') {"""
if old not in text:
    raise SystemExit('signature block not found')
text=text.replace(old,new)
p.write_text(text, encoding='utf-8')
