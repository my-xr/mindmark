package com.mindmark.server.modules.exam.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "exam_participant")
public class ExamParticipantEntity {

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

    @Column(name = "class_id", nullable = false, length = 64)
    private String classId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
