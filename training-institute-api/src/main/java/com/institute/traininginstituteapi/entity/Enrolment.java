package com.institute.traininginstituteapi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrolment")
public class Enrolment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrolment_id")
    private Long enrolmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Column(name = "enrolment_date", nullable = false)
    private LocalDateTime enrolmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrolmentStatus status = EnrolmentStatus.ENROLLED;

    @Column(name = "attendance_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal attendancePercentage = BigDecimal.ZERO;

    @Column(length = 255)
    private String remarks;

    public Long getEnrolmentId() { return enrolmentId; }
    public void setEnrolmentId(Long enrolmentId) { this.enrolmentId = enrolmentId; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public Batch getBatch() { return batch; }
    public void setBatch(Batch batch) { this.batch = batch; }
    public LocalDateTime getEnrolmentDate() { return enrolmentDate; }
    public void setEnrolmentDate(LocalDateTime enrolmentDate) { this.enrolmentDate = enrolmentDate; }
    public EnrolmentStatus getStatus() { return status; }
    public void setStatus(EnrolmentStatus status) { this.status = status; }
    public BigDecimal getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(BigDecimal attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
