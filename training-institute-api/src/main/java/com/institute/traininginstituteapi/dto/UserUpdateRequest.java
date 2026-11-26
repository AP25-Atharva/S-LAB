package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Edit a user's name, role or active flag. Username is fixed; passwords change via their own endpoints. */
public record UserUpdateRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,
        @NotNull(message = "Role is required (ADMIN or STAFF)")
        UserRole role,
        @NotNull(message = "Active is required")
        Boolean active) {
}
