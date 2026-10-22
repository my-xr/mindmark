package com.mindmark.server.modules.grading.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ObjectiveGradingPolicyTest {

    private final ObjectiveGradingPolicy policy = new ObjectiveGradingPolicy(new ObjectMapper());

    @Test
    void restoresDisplayedSingleChoiceKeyBeforeGrading() {
        QuestionEntity question = question(QuestionType.SINGLE_CHOICE, "\"B\"");

        var result = policy.grade(
            question,
            "\"A\"",
            new BigDecimal("2"),
            Map.of("A", "B", "B", "D", "C", "A", "D", "C")
        );

        assertThat(result.correct()).isTrue();
        assertThat(result.score()).isEqualByComparingTo("2");
    }

    @Test
    void restoresDisplayedMultipleChoiceKeysBeforeGrading() {
        QuestionEntity question = question(QuestionType.MULTIPLE_CHOICE, "[\"A\",\"C\"]");

        var result = policy.grade(
            question,
            "[\"D\",\"B\"]",
            new BigDecimal("4"),
            Map.of("A", "D", "B", "C", "C", "B", "D", "A")
        );

        assertThat(result.correct()).isTrue();
        assertThat(result.score()).isEqualByComparingTo("4");
    }

    @Test
    void treatsUnmappedDisplayedChoiceAsIncorrect() {
        QuestionEntity question = question(QuestionType.SINGLE_CHOICE, "\"B\"");

        var result = policy.grade(
            question,
            "\"B\"",
            new BigDecimal("2"),
            Map.of("A", "B", "B", "D", "C", "A", "D", "C")
        );

        assertThat(result.correct()).isFalse();
        assertThat(result.score()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    private QuestionEntity question(QuestionType type, String answerJson) {
        QuestionEntity question = new QuestionEntity();
        question.setType(type);
        question.setDifficulty(Difficulty.MEDIUM);
        question.setAnswerJson(answerJson);
        return question;
    }
}
