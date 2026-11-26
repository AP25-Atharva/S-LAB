package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.Enrolment;
import com.institute.traininginstituteapi.entity.EnrolmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EnrolmentResponse(
        Long enrolmentId,
        Long studentId,
        String studentCode,
        String studentName,
        String studentEmail,
        Long batchId,
        String batchCode,
        String courseTitle,
        LocalDateTime enrolmentDate,
        EnrolmentStatus status,
        BigDecimal attendancePercentage,
        String remarks) {

    public static EnrolmentResponse from(Enrolment e) {
        return new EnrolmentResponse(e.getEnrolmentId(),
                e.getStudent().getStudentId(), e.getStudent().getStudentCode(),
                e.getStudent().getFullName(), e.getStudent().getEmail(),
                e.getBatch().getBatchId(), e.getBatch().getBatchCode(), e.getBatch().getCourse().getTitle(),
                e.getEnrolmentDate(), e.getStatus(), e.getAttendancePercentage(), e.getRemarks());
    }
}
