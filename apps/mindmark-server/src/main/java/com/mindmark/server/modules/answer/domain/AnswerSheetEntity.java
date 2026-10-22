package com.mindmark.server.modules.answer.domain;

import com.mindmark.server.modules.exam.domain.ExamEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "answer_sheet")
public class AnswerSheetEntity {

    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private ExamEntity exam;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name", nullable = false, length = 64)
    private String studentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AnswerSheetStatus status;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "option_order_json", nullable = false, columnDefinition = "text")
    private String optionOrderJson = "{}";

    @OneToMany(mappedBy = "answerSheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("updatedAt ASC")
    private List<AnswerItemEntity> items = new ArrayList<>();

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "client_saved_at")
    private OffsetDateTime clientSavedAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public AnswerSheetStatus getStatus() { return status; }
    public void setStatus(AnswerSheetStatus status) { this.status = status; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getOptionOrderJson() { return optionOrderJson; }
    public void setOptionOrderJson(String optionOrderJson) {
        this.optionOrderJson = optionOrderJson == null || optionOrderJson.isBlank() ? "{}" : optionOrderJson;
    }
    public List<AnswerItemEntity> getItems() { return items; }
    public void setItems(List<AnswerItemEntity> items) { this.items = items; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getClientSavedAt() { return clientSavedAt; }
    public void setClientSavedAt(OffsetDateTime clientSavedAt) { this.clientSavedAt = clientSavedAt; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
