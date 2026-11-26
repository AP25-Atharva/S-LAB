package com.institute.traininginstituteapi.security;

import org.springframework.security.oauth2.jwt.Jwt;

/** Reads the logged-in user's id from their token. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static Long id(Jwt jwt) {
        Object uid = jwt.getClaim(TokenService.USER_ID_CLAIM);
        return uid instanceof Number n ? n.longValue() : null;
    }
}
