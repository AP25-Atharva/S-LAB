package com.institute.traininginstituteapi.dto;

import jakarta.validation.constraints.*;

public record TrainerRequest(
        @NotBlank(message = "Trainer code is required")
        @Size(max = 20, message = "Trainer code must be at most 20 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Trainer code may contain only letters, digits, '-' and '_'")
        String trainerCode,

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

        @Size(max = 150, message = "Expertise must be at most 150 characters")
        String expertise,

        Boolean active) {
}
