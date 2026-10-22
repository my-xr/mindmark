package com.mindmark.server.modules.answer.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AnswerSheetOptionOrderServiceTest {

    private final AnswerSheetOptionOrderService service = new AnswerSheetOptionOrderService(new ObjectMapper());

    @Test
    void createsStableNonIdentityMappingForNewChoiceAnswerSheet() {
        AnswerSheetEntity answerSheet = answerSheet(0);
        PaperEntity paper = paper(choiceQuestion("question-1"));

        Map<String, Map<String, String>> first = service.ensureOptionOrder(answerSheet, paper);
        Map<String, Map<String, String>> second = service.ensureOptionOrder(answerSheet, paper);
        Map<String, String> mapping = first.get("question-1");

        assertThat(mapping.keySet()).containsExactlyInAnyOrder("A", "B", "C", "D");
        assertThat(mapping.values()).containsExactlyInAnyOrder("A", "B", "C", "D");
        assertThat(mapping).isNotEqualTo(Map.of("A", "A", "B", "B", "C", "C", "D", "D"));
        assertThat(second).isEqualTo(first);
        assertThat(answerSheet.getOptionOrderJson()).contains("question-1");
    }

    @Test
    void usesIdentityMappingForLegacyAnswerSheetWithSavedAnswers() {
        AnswerSheetEntity answerSheet = answerSheet(2);
        PaperEntity paper = paper(choiceQuestion("question-1"));

        Map<String, String> mapping = service.ensureOptionOrder(answerSheet, paper).get("question-1");

        assertThat(mapping).containsEntry("A", "A")
            .containsEntry("B", "B")
            .containsEntry("C", "C")
            .containsEntry("D", "D");
    }

    private AnswerSheetEntity answerSheet(int version) {
        AnswerSheetEntity answerSheet = new AnswerSheetEntity();
        answerSheet.setVersion(version);
        answerSheet.setStatus(AnswerSheetStatus.DRAFT);
        return answerSheet;
    }

    private PaperEntity paper(QuestionEntity question) {
        PaperQuestionEntity paperQuestion = new PaperQuestionEntity();
        paperQuestion.setId("paper-question-" + question.getId());
        paperQuestion.setQuestion(question);

        PaperEntity paper = new PaperEntity();
        paper.setQuestions(List.of(paperQuestion));
        return paper;
    }

    private QuestionEntity choiceQuestion(String id) {
        QuestionEntity question = new QuestionEntity();
        question.setId(id);
        question.setType(QuestionType.SINGLE_CHOICE);
        question.setDifficulty(Difficulty.MEDIUM);
        question.setOptionsJson("""
            [
              {"key":"A","content":"option A"},
              {"key":"B","content":"option B"},
              {"key":"C","content":"option C"},
              {"key":"D","content":"option D"}
            ]
            """);
        return question;
    }
}
