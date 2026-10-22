package com.mindmark.server.modules.ai.domain;

import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ai_question_generation_task")
public class AiQuestionGenerationTaskEntity {
    @Id
    @Column(length = 96)
    private String id;

    @Column(name = "teacher_id", nullable = false, length = 64)
    private String teacherId;

    @Column(name = "teacher_name", nullable = false, length = 128)
    private String teacherName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AiQuestionGenerationTaskStatus status;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(nullable = false, columnDefinition = "text")
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 32)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Difficulty difficulty;

    @Column(nullable = false)
    private Integer count;

    @Column(name = "knowledge_point", columnDefinition = "text")
    private String knowledgePoint;

    @Column(columnDefinition = "text")
    private String requirement;

    @Column(name = "generated_question_ids", columnDefinition = "text")
    private String generatedQuestionIds;

    @Column(name = "generated_count")
    private Integer generatedCount;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "requested_at", nullable = false)
    private OffsetDateTime requestedAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    public AiQuestionGenerationTaskStatus getStatus() { return status; }
    public void setStatus(AiQuestionGenerationTaskStatus status) { this.status = status; }
    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public String getKnowledgePoint() { return knowledgePoint; }
    public void setKnowledgePoint(String knowledgePoint) { this.knowledgePoint = knowledgePoint; }
    public String getRequirement() { return requirement; }
    public void setRequirement(String requirement) { this.requirement = requirement; }
    public String getGeneratedQuestionIds() { return generatedQuestionIds; }
    public void setGeneratedQuestionIds(String generatedQuestionIds) { this.generatedQuestionIds = generatedQuestionIds; }
    public Integer getGeneratedCount() { return generatedCount; }
    public void setGeneratedCount(Integer generatedCount) { this.generatedCount = generatedCount; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(OffsetDateTime requestedAt) { this.requestedAt = requestedAt; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}