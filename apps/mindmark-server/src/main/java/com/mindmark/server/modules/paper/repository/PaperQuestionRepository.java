package com.mindmark.server.modules.paper.repository;

import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.paper.domain.PaperStatus;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaperQuestionRepository extends JpaRepository<PaperQuestionEntity, String> {

    long countByQuestion_Id(String questionId);

    long countByQuestion_IdAndPaper_StatusIn(String questionId, Collection<PaperStatus> statuses);

    List<PaperQuestionEntity> findByQuestion_Id(String questionId);

    List<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId);

    Page<PaperQuestionEntity> findByPaper_IdOrderByOrderIndexAsc(String paperId, Pageable pageable);

    boolean existsByPaper_IdAndQuestion_Id(String paperId, String questionId);
}
