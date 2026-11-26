package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.StudentStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record StudentRequest(
        @NotBlank(message = "Student code is required")
        @Size(max = 20, message = "Student code must be at most 20 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Student code may contain only letters, digits, '-' and '_'")
        String studentCode,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid address")
        @Size(max = 120, message = "Email must be at most 120 characters")
        String email,

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^\\+?[0-9]{10,14}$", message = "Phone must be 10-14 digits, optionally starting with +")
        String phone,

        @Size(max = 100, message = "Qualification must be at most 100 characters")
        String qualification,

        @NotNull(message = "Registration date is required")
        @PastOrPresent(message = "Registration date cannot be in the future")
        LocalDate registrationDate,

        StudentStatus status) {
}
