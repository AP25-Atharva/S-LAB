package com.institute.traininginstituteapi.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * The visitor's IP address. Requests arrive through Vercel and Render's proxy, which put the original
 * client address first in X-Forwarded-For. Only used to rate-limit logins.
 */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty() && first.length() <= 45) return first;
        }
        return request.getRemoteAddr();
    }
}
