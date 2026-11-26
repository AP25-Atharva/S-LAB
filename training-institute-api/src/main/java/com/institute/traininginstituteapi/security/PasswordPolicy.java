package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.InvalidFieldException;

import java.util.Locale;
import java.util.Set;

/** Rules for every new password: 10-72 characters, a letter and a digit, not common, not the username. */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 10;
    public static final int MAX_LENGTH = 72; // BCrypt only uses the first 72 bytes

    private static final Set<String> COMMON = Set.of(
            "password", "password1", "password12", "password123", "password1234", "passw0rd", "p@ssw0rd",
            "1234567890", "0123456789", "123456789a", "a123456789", "qwertyuiop", "qwerty1234", "qwerty123",
            "1q2w3e4r5t", "1qaz2wsx3edc", "iloveyou12", "welcome123", "welcome1234", "admin12345", "admin123456",
            "administrator", "letmein123", "abcd123456", "abc1234567", "changeme123", "batchwise1", "batchwise123",
            "skilllab123", "training123", "student123", "trainer123", "india12345");

    private PasswordPolicy() {
    }

    /** @param field the request field to attach the error to (e.g. "password" or "newPassword") */
    public static void check(String password, String username, String field) {
        if (password == null || password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new InvalidFieldException(field, "Password must be " + MIN_LENGTH + "-" + MAX_LENGTH + " characters");
        }
        if (!password.chars().anyMatch(Character::isLetter) || !password.chars().anyMatch(Character::isDigit)) {
            throw new InvalidFieldException(field, "Password must contain at least one letter and one number");
        }
        String lower = password.toLowerCase(Locale.ROOT);
        if (COMMON.contains(lower)) {
            throw new InvalidFieldException(field, "This password is too common - choose another");
        }
        if (username != null && username.length() >= 3 && lower.contains(username.toLowerCase(Locale.ROOT))) {
            throw new InvalidFieldException(field, "Password must not contain the username");
        }
    }
}
