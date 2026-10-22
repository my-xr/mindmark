package com.mindmark.server.modules.answer.repository;

import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerItemRepository extends JpaRepository<AnswerItemEntity, String> {

    List<AnswerItemEntity> findByAnswerSheetIdAndQuestionIdIn(String answerSheetId, Collection<String> questionIds);
}
