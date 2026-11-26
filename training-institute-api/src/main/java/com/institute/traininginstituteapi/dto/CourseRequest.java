package com.institute.traininginstituteapi.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CourseRequest(
        @NotBlank(message = "Course code is required")
        @Size(max = 20, message = "Course code must be at most 20 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Course code may contain only letters, digits, '-' and '_'")
        String courseCode,

        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 150, message = "Title must be 3-150 characters")
        String title,

        @NotBlank(message = "Category is required")
        @Size(max = 80, message = "Category must be at most 80 characters")
        String category,

        @NotNull(message = "Duration is required")
        @Min(value = 1, message = "Duration must be at least 1 hour")
        @Max(value = 2000, message = "Duration must be at most 2000 hours")
        Integer durationHours,

        @NotNull(message = "Fee is required")
        @DecimalMin(value = "0.00", message = "Fee cannot be negative")
        @Digits(integer = 8, fraction = 2, message = "Fee must have at most 8 digits and 2 decimals")
        BigDecimal fee,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        Boolean active) {
}
