from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamRepository.java')
text=p.read_text(encoding='utf-8')
needle='''    @EntityGraph(attributePaths = {"paper", "classIds"})\n    List<ExamEntity> findAllByOrderByUpdatedAtDesc();\n'''
insert='''    @EntityGraph(attributePaths = {"paper", "classIds"})\n    List<ExamEntity> findAllByOrderByUpdatedAtDesc();\n\n    @EntityGraph(attributePaths = {"paper", "classIds"})\n    @Query("""\n        select distinct exam\n        from ExamEntity exam join exam.classIds classId\n        where classId = :classId\n        order by exam.startAt desc, exam.updatedAt desc\n        """)\n    List<ExamEntity> findByClassIdOrderByStartAtDesc(@Param("classId") String classId);\n'''
if needle not in text:
    raise SystemExit('needle not found')
text=text.replace(needle, insert, 1)
p.write_text(text, encoding='utf-8')
