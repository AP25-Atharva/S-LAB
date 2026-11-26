package com.institute.traininginstituteapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Admin sets a new password for a user. */
public record PasswordResetRequest(
        @NotBlank(message = "New password is required")
        @Size(min = 10, max = 72, message = "Password must be 10-72 characters")
        String newPassword) {
}
