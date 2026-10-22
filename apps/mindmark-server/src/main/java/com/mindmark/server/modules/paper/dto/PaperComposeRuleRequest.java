package com.mindmark.server.modules.paper.dto;

import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

public record PaperComposeRuleRequest(
    @NotNull QuestionType type,
    @NotNull @Min(0) Integer count,
    @NotNull @DecimalMin("0.1") BigDecimal score,
    List<Difficulty> difficulties,
    List<String> chapterIds,
    Integer chapterFromNo,
    Integer chapterToNo,
    List<String> knowledgePoints
) implements Serializable {
}
