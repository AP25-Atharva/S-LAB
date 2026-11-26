package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.entity.UserRole;

import java.time.LocalDateTime;

/** A user as the API exposes it - never includes the password hash. */
public record UserResponse(
        Long userId,
        String username,
        String fullName,
        UserRole role,
        boolean active,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt) {

    public static UserResponse from(AppUser u) {
        return new UserResponse(u.getUserId(), u.getUsername(), u.getFullName(), u.getRole(), u.isActive(),
                u.getLastLoginAt(), u.getCreatedAt());
    }
}
