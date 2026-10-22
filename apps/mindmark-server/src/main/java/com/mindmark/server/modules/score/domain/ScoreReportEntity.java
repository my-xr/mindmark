package com.mindmark.server.modules.score.domain;

import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "score_report")
public class ScoreReportEntity {

    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private ExamEntity exam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answer_sheet_id", nullable = false)
    private AnswerSheetEntity answerSheet;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name", nullable = false, length = 64)
    private String studentName;

    @Column(name = "exam_title", nullable = false, length = 200)
    private String examTitle;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "rank_no")
    private Integer rankNo;

    @Column(name = "weak_knowledge_points_json", nullable = false, columnDefinition = "text")
    private String weakKnowledgePointsJson;

    @Column(nullable = false, columnDefinition = "text")
    private String feedback;

    @Column(name = "published_at", nullable = false)
    private OffsetDateTime publishedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    public AnswerSheetEntity getAnswerSheet() { return answerSheet; }
    public void setAnswerSheet(AnswerSheetEntity answerSheet) { this.answerSheet = answerSheet; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getExamTitle() { return examTitle; }
    public void setExamTitle(String examTitle) { this.examTitle = examTitle; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public Integer getRankNo() { return rankNo; }
    public void setRankNo(Integer rankNo) { this.rankNo = rankNo; }
    public String getWeakKnowledgePointsJson() { return weakKnowledgePointsJson; }
    public void setWeakKnowledgePointsJson(String weakKnowledgePointsJson) { this.weakKnowledgePointsJson = weakKnowledgePointsJson; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }
}