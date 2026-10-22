package com.mindmark.server.modules.question.dto;

public record MarkdownQuestionImportRequest(
    String courseId,
    String chapterId,
    String markdown,
    String fileName
) {
}