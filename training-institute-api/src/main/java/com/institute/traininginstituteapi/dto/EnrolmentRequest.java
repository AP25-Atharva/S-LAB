package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.EnrolmentStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record EnrolmentRequest(
        @NotNull(message = "Student is required")
        Long studentId,

        @NotNull(message = "Batch is required")
        Long batchId,

        /* Optional: ENROLLED (default) or WAITLISTED on create; any status on update. */
        EnrolmentStatus status,

        @DecimalMin(value = "0.00", message = "Attendance cannot be below 0")
        @DecimalMax(value = "100.00", message = "Attendance cannot exceed 100")
        @Digits(integer = 3, fraction = 2, message = "Attendance may have at most 2 decimals")
        BigDecimal attendancePercentage,

        @Size(max = 255, message = "Remarks must be at most 255 characters")
        String remarks) {
}
