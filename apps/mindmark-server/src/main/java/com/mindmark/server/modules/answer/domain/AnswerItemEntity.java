package com.mindmark.server.modules.answer.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "answer_item")
public class AnswerItemEntity {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answer_sheet_id", nullable = false)
    private AnswerSheetEntity answerSheet;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(name = "answer_json", nullable = false, columnDefinition = "text")
    private String answerJson;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public AnswerSheetEntity getAnswerSheet() { return answerSheet; }
    public void setAnswerSheet(AnswerSheetEntity answerSheet) { this.answerSheet = answerSheet; }
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getAnswerJson() { return answerJson; }
    public void setAnswerJson(String answerJson) { this.answerJson = answerJson; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
