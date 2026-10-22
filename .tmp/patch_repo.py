from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/repository/PaperQuestionRepository.java')
s=p.read_text(encoding='utf-8')
s=s.replace('import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;\nimport org.springframework.data.jpa.repository.JpaRepository;\n', 'import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;\nimport java.util.List;\nimport org.springframework.data.jpa.repository.JpaRepository;\n')
s=s.replace('    long countByQuestion_Id(String questionId);\n', '    long countByQuestion_Id(String questionId);\n\n    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);\n')
p.write_text(s, encoding='utf-8', newline='\n')
