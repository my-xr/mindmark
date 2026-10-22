package com.mindmark.server.modules.programming.domain;

import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programming_judge_submission")
public class ProgrammingJudgeSubmissionEntity {
    @Id @Column(length = 96) private String id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exam_id", nullable = false) private ExamEntity exam;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "answer_sheet_id", nullable = false) private AnswerSheetEntity answerSheet;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "answer_item_id") private AnswerItemEntity answerItem;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private QuestionEntity question;
    @Column(name = "student_id", nullable = false, length = 64) private String studentId;
    @Column(name = "student_name", nullable = false, length = 64) private String studentName;
    @Column(nullable = false, length = 32) private String language;
    @Column(name = "source_code_snapshot", nullable = false, columnDefinition = "text") private String sourceCodeSnapshot;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private ProgrammingJudgeStatus status;
    @Column(precision = 8, scale = 2) private BigDecimal score;
    @Column(name = "max_score", nullable = false, precision = 8, scale = 2) private BigDecimal maxScore;
    @Column(name = "queued_at", nullable = false) private OffsetDateTime queuedAt;
    @Column(name = "started_at") private OffsetDateTime startedAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    @Column(name = "error_summary", columnDefinition = "text") private String errorSummary;
    @Column(name = "judge_version", nullable = false, length = 64) private String judgeVersion;
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY) @OrderBy("createdAt ASC") private List<ProgrammingJudgeResultEntity> results = new ArrayList<>();
    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; } public void setExam(ExamEntity exam) { this.exam = exam; }
    public AnswerSheetEntity getAnswerSheet() { return answerSheet; } public void setAnswerSheet(AnswerSheetEntity answerSheet) { this.answerSheet = answerSheet; }
    public AnswerItemEntity getAnswerItem() { return answerItem; } public void setAnswerItem(AnswerItemEntity answerItem) { this.answerItem = answerItem; }
    public QuestionEntity getQuestion() { return question; } public void setQuestion(QuestionEntity question) { this.question = question; }
    public String getStudentId() { return studentId; } public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
    public String getSourceCodeSnapshot() { return sourceCodeSnapshot; } public void setSourceCodeSnapshot(String sourceCodeSnapshot) { this.sourceCodeSnapshot = sourceCodeSnapshot; }
    public ProgrammingJudgeStatus getStatus() { return status; } public void setStatus(ProgrammingJudgeStatus status) { this.status = status; }
    public BigDecimal getScore() { return score; } public void setScore(BigDecimal score) { this.score = score; }
    public BigDecimal getMaxScore() { return maxScore; } public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public OffsetDateTime getQueuedAt() { return queuedAt; } public void setQueuedAt(OffsetDateTime queuedAt) { this.queuedAt = queuedAt; }
    public OffsetDateTime getStartedAt() { return startedAt; } public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; } public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public String getErrorSummary() { return errorSummary; } public void setErrorSummary(String errorSummary) { this.errorSummary = errorSummary; }
    public String getJudgeVersion() { return judgeVersion; } public void setJudgeVersion(String judgeVersion) { this.judgeVersion = judgeVersion; }
    public List<ProgrammingJudgeResultEntity> getResults() { return results; } public void setResults(List<ProgrammingJudgeResultEntity> results) { this.results = results; }
}
