package com.mindmark.server.modules.question.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "question")
public class QuestionEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, columnDefinition = "text")
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Difficulty difficulty;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "course_name", nullable = false, length = 128)
    private String courseName;

    @Column(name = "chapter_id", length = 64)
    private String chapterId;

    @Column(name = "chapter_no")
    private Integer chapterNo;

    @Column(name = "chapter_title", length = 128)
    private String chapterTitle;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "question_knowledge_point", joinColumns = @JoinColumn(name = "question_id"))
    @OrderColumn(name = "order_index")
    @Column(name = "knowledge_point", nullable = false, length = 128)
    private List<String> knowledgePoints = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionStatus status;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "answer_json", nullable = false, columnDefinition = "text")
    private String answerJson;

    @Column(nullable = false, columnDefinition = "text")
    private String analysis;

    @Column(name = "options_json", nullable = false, columnDefinition = "text")
    private String optionsJson;

    @Column(name = "scoring_points_json", nullable = false, columnDefinition = "text")
    private String scoringPointsJson;

    @Column(name = "created_by", nullable = false, length = 64)
    private String createdBy;

    @Column(name = "reviewed_by", length = 64)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "review_comment", columnDefinition = "text")
    private String reviewComment;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_action", length = 32)
    private QuestionReviewAction reviewAction;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getChapterId() {
        return chapterId;
    }

    public void setChapterId(String chapterId) {
        this.chapterId = chapterId;
    }

    public Integer getChapterNo() {
        return chapterNo;
    }

    public void setChapterNo(Integer chapterNo) {
        this.chapterNo = chapterNo;
    }

    public String getChapterTitle() {
        return chapterTitle;
    }

    public void setChapterTitle(String chapterTitle) {
        this.chapterTitle = chapterTitle;
    }

    public List<String> getKnowledgePoints() {
        return knowledgePoints;
    }

    public void setKnowledgePoints(List<String> knowledgePoints) {
        this.knowledgePoints = knowledgePoints == null ? new ArrayList<>() : new ArrayList<>(knowledgePoints);
    }

    public QuestionSource getSource() {
        return source;
    }

    public void setSource(QuestionSource source) {
        this.source = source;
    }

    public QuestionStatus getStatus() {
        return status;
    }

    public void setStatus(QuestionStatus status) {
        this.status = status;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public String getAnswerJson() {
        return answerJson;
    }

    public void setAnswerJson(String answerJson) {
        this.answerJson = answerJson;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson) {
        this.optionsJson = optionsJson;
    }

    public String getScoringPointsJson() {
        return scoringPointsJson;
    }

    public void setScoringPointsJson(String scoringPointsJson) {
        this.scoringPointsJson = scoringPointsJson;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public OffsetDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(OffsetDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }

    public QuestionReviewAction getReviewAction() {
        return reviewAction;
    }

    public void setReviewAction(QuestionReviewAction reviewAction) {
        this.reviewAction = reviewAction;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}