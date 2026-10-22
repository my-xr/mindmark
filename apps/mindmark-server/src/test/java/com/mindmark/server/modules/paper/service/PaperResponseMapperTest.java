package com.mindmark.server.modules.paper.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;
import com.mindmark.server.modules.question.service.QuestionResponseMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PaperResponseMapperTest {

    private final PaperResponseMapper mapper = new PaperResponseMapper(
        new QuestionResponseMapper(new ObjectMapper())
    );

    @Test
    void studentResponseReordersOptionsWithoutLeakingAnswer() {
        PaperEntity paper = paper(question());
        Map<String, Map<String, String>> optionOrder = Map.of(
            "question-1",
            Map.of("A", "C", "B", "A", "C", "D", "D", "B")
        );

        var response = mapper.toStudentResponse(paper, optionOrder);
        var studentQuestion = response.questions().getFirst().question();

        assertThat(studentQuestion.answer()).isNull();
        assertThat(studentQuestion.analysis()).isNull();
        assertThat(studentQuestion.scoringPoints()).isNull();
        assertThat(studentQuestion.options().get(0).get("key").asText()).isEqualTo("A");
        assertThat(studentQuestion.options().get(0).get("content").asText()).isEqualTo("option C");
        assertThat(studentQuestion.options().get(1).get("key").asText()).isEqualTo("B");
        assertThat(studentQuestion.options().get(1).get("content").asText()).isEqualTo("option A");
    }

    @Test
    void answerKeyContainsCanonicalQuestionAnswerAndScoringData() {
        PaperEntity paper = paper(question());

        var answerKey = mapper.toAnswerKeyResponse(paper);
        var item = answerKey.items().getFirst();

        assertThat(answerKey.totalScore()).isEqualByComparingTo("2");
        assertThat(item.question().answer().asText()).isEqualTo("B");
        assertThat(item.question().analysis()).isEqualTo("Explanation");
        assertThat(item.question().scoringPoints()).isNotNull();
        assertThat(item.question().options()).hasSize(4);
    }

    private PaperEntity paper(QuestionEntity question) {
        PaperQuestionEntity paperQuestion = new PaperQuestionEntity();
        paperQuestion.setId("paper-question-1");
        paperQuestion.setQuestion(question);
        paperQuestion.setOrderIndex(1);
        paperQuestion.setScore(new BigDecimal("2"));

        PaperEntity paper = new PaperEntity();
        paper.setId("paper-1");
        paper.setTitle("Paper");
        paper.setCourseId("course-1");
        paper.setCourseName("Course");
        paper.setTotalScore(new BigDecimal("2"));
        paper.setUpdatedAt(OffsetDateTime.parse("2026-09-30T12:00:00+08:00"));
        paper.setQuestions(List.of(paperQuestion));
        return paper;
    }

    private QuestionEntity question() {
        QuestionEntity question = new QuestionEntity();
        question.setId("question-1");
        question.setTitle("Question");
        question.setType(QuestionType.SINGLE_CHOICE);
        question.setDifficulty(Difficulty.MEDIUM);
        question.setCourseId("course-1");
        question.setCourseName("Course");
        question.setSource(QuestionSource.MANUAL);
        question.setStatus(QuestionStatus.ACTIVE);
        question.setScore(new BigDecimal("2"));
        question.setAnswerJson("\"B\"");
        question.setAnalysis("Explanation");
        question.setOptionsJson("""
            [
              {"key":"A","content":"option A"},
              {"key":"B","content":"option B"},
              {"key":"C","content":"option C"},
              {"key":"D","content":"option D"}
            ]
            """);
        question.setScoringPointsJson("[{\"id\":\"SP-1\",\"description\":\"point\",\"score\":2,\"keywords\":[],\"required\":true}]");
        question.setCreatedBy("teacher");
        question.setUpdatedAt(OffsetDateTime.parse("2026-09-30T12:00:00+08:00"));
        return question;
    }
}
