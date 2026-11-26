package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.BatchMode;
import com.institute.traininginstituteapi.entity.BatchStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record BatchRequest(
        @NotBlank(message = "Batch code is required")
        @Size(max = 20, message = "Batch code must be at most 20 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Batch code may contain only letters, digits, '-' and '_'")
        String batchCode,

        @NotNull(message = "Course is required")
        Long courseId,

        @NotNull(message = "Trainer is required")
        Long trainerId,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate,

        @NotNull(message = "Mode is required (CLASSROOM, ONLINE or HYBRID)")
        BatchMode mode,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        @Max(value = 500, message = "Capacity must be at most 500")
        Integer capacity,

        BatchStatus status) {

    @AssertTrue(message = "End date must be on or after start date")
    public boolean isEndDateValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
