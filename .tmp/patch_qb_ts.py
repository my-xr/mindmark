from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text('utf-8')
s=s.replace("  type TableProps,\n} from 'ant-design-vue';", "  type TableColumnsType,\n  type TableProps,\n} from 'ant-design-vue';")
s=s.replace("const questionColumns = computed<TableProps<Question>['columns']>(() => [", "const questionColumns = computed<TableColumnsType<Question>>(() => [")
insert = """\nconst toQuestionRecord = (record: Question | Record<string, unknown>) => record as Question;\n\nconst getQuestionSourceLabel = (record: Question | Record<string, unknown>) =>\n  SOURCE_META[toQuestionRecord(record).source];\n\nconst editQuestionRecord = (record: Question | Record<string, unknown>) => {\n  openEdit(toQuestionRecord(record));\n};\n\nconst composeQuestionRecord = (record: Question | Record<string, unknown>) => {\n  void openCompose(toQuestionRecord(record));\n};\n\nconst deleteQuestionRecord = (record: Question | Record<string, unknown>) => {\n  void confirmDeleteQuestion(toQuestionRecord(record));\n};\n"""
s=s.replace("const createQuestionRowProps = (record: Question) => ({\n", insert + "\nconst createQuestionRowProps = (record: Question) => ({\n")
s=s.replace(":label=\"SOURCE_META[record.source]\"", ":label=\"getQuestionSourceLabel(record)\"")
s=s.replace('@click.stop="openEdit(record)"', '@click.stop="editQuestionRecord(record)"')
s=s.replace('@click.stop="openCompose(record)"', '@click.stop="composeQuestionRecord(record)"')
s=s.replace(':loading="deletingQuestionId === record.id"', ':loading="deletingQuestionId === toQuestionRecord(record).id"')
s=s.replace('@click.stop="confirmDeleteQuestion(record)"', '@click.stop="deleteQuestionRecord(record)"')
p.write_text(s, 'utf-8')
