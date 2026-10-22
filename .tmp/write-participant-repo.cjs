const fs = require('fs');
function write(path, content) { fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), { encoding: 'utf8' }); }
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/exam/repository/ExamParticipantRepository.java', `package com.mindmark.server.modules.exam.repository;

import com.mindmark.server.modules.exam.domain.ExamParticipantEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExamParticipantRepository extends JpaRepository<ExamParticipantEntity, String> {

    @EntityGraph(attributePaths = {"exam", "exam.paper", "exam.classIds"})
    List<ExamParticipantEntity> findByStudentIdOrderByCreatedAtDesc(String studentId);

    long countByExamId(String examId);

    @Query("select participant.exam.id, count(participant) from ExamParticipantEntity participant where participant.exam.id in :examIds group by participant.exam.id")
    List<Object[]> countByExamIds(@Param("examIds") Collection<String> examIds);
}
`);
