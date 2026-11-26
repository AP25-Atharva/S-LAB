package com.institute.traininginstituteapi.dto;

import java.time.Instant;

/** Returned by POST /api/auth/login. The UI sends the token back as "Authorization: Bearer <token>". */
public record LoginResponse(String token, Instant expiresAt, UserResponse user) {
}
