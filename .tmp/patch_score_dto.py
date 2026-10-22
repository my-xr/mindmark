from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/score/dto/ExamScoreSummaryResponse.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('    Integer reviewedCount,\n    BigDecimal averageScore,', '    Integer reviewedCount,\n    Integer submittedCount,\n    BigDecimal averageScore,')
p.write_text(text,encoding='utf-8')
