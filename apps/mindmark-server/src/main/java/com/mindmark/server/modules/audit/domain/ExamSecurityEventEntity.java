package com.mindmark.server.modules.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "exam_security_event")
public class ExamSecurityEventEntity {

    @Id
    @Column(length = 96)
    private String id;

    @Column(name = "exam_id", nullable = false, length = 64)
    private String examId;

    @Column(name = "answer_sheet_id", length = 96)
    private String answerSheetId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name", nullable = false, length = 64)
    private String studentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private ExamSecurityEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ExamSecuritySeverity severity;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "client_event_count", nullable = false)
    private Integer clientEventCount;

    @Column(name = "client_occurred_at")
    private OffsetDateTime clientOccurredAt;

    @Column(name = "server_received_at", nullable = false)
    private OffsetDateTime serverReceivedAt;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }
    public String getAnswerSheetId() { return answerSheetId; }
    public void setAnswerSheetId(String answerSheetId) { this.answerSheetId = answerSheetId; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public ExamSecurityEventType getEventType() { return eventType; }
    public void setEventType(ExamSecurityEventType eventType) { this.eventType = eventType; }
    public ExamSecuritySeverity getSeverity() { return severity; }
    public void setSeverity(ExamSecuritySeverity severity) { this.severity = severity; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getClientEventCount() { return clientEventCount; }
    public void setClientEventCount(Integer clientEventCount) { this.clientEventCount = clientEventCount; }
    public OffsetDateTime getClientOccurredAt() { return clientOccurredAt; }
    public void setClientOccurredAt(OffsetDateTime clientOccurredAt) { this.clientOccurredAt = clientOccurredAt; }
    public OffsetDateTime getServerReceivedAt() { return serverReceivedAt; }
    public void setServerReceivedAt(OffsetDateTime serverReceivedAt) { this.serverReceivedAt = serverReceivedAt; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
