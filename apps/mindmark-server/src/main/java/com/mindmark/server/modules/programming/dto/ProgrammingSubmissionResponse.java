package com.mindmark.server.modules.programming.dto;

import com.mindmark.server.modules.programming.domain.ProgrammingJudgeStatus;
import java.math.BigDecimal;
import java.util.List;

public record ProgrammingSubmissionResponse(
    String id,
    String examId,
    String answerSheetId,
    String answerItemId,
    String questionId,
    String questionTitle,
    String studentId,
    String studentName,
    String language,
    ProgrammingJudgeStatus status,
    BigDecimal score,
    BigDecimal maxScore,
    String queuedAt,
    String startedAt,
    String finishedAt,
    String errorSummary,
    String judgeVersion,
    List<ProgrammingJudgeResultResponse> results
) {
}
