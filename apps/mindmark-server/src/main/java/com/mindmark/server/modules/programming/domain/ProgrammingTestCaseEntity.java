package com.mindmark.server.modules.programming.domain;

import com.mindmark.server.modules.question.domain.QuestionEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "programming_test_case")
public class ProgrammingTestCaseEntity {
    @Id @Column(length = 64) private String id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private QuestionEntity question;
    @Column(nullable = false, length = 200) private String title;
    @Column(name = "input_payload", nullable = false, columnDefinition = "text") private String inputPayload;
    @Column(name = "expected_output", nullable = false, columnDefinition = "text") private String expectedOutput;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private ProgrammingTestCaseVisibility visibility;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal weight;
    @Column(name = "sort_order", nullable = false) private Integer sortOrder;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public QuestionEntity getQuestion() { return question; } public void setQuestion(QuestionEntity question) { this.question = question; }
    public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
    public String getInputPayload() { return inputPayload; } public void setInputPayload(String inputPayload) { this.inputPayload = inputPayload; }
    public String getExpectedOutput() { return expectedOutput; } public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public ProgrammingTestCaseVisibility getVisibility() { return visibility; } public void setVisibility(ProgrammingTestCaseVisibility visibility) { this.visibility = visibility; }
    public BigDecimal getWeight() { return weight; } public void setWeight(BigDecimal weight) { this.weight = weight; }
    public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getCreatedBy() { return createdBy; } public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
