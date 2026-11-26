package com.institute.traininginstituteapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A logged-in user changes their own password. */
public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,
        @NotBlank(message = "New password is required")
        @Size(min = 10, max = 72, message = "Password must be 10-72 characters")
        String newPassword) {
}
