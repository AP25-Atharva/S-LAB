package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.ChangePasswordRequest;
import com.institute.traininginstituteapi.dto.LoginRequest;
import com.institute.traininginstituteapi.dto.LoginResponse;
import com.institute.traininginstituteapi.dto.UserResponse;
import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.exception.AuthenticationFailedException;
import com.institute.traininginstituteapi.exception.InvalidFieldException;
import com.institute.traininginstituteapi.repository.AppUserRepository;
import com.institute.traininginstituteapi.security.LoginAttemptService;
import com.institute.traininginstituteapi.security.PasswordPolicy;
import com.institute.traininginstituteapi.security.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String BAD_LOGIN = "Invalid username or password";

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final LoginAttemptService attempts;
    /** Compared against when the username does not exist, so both cases take the same time. */
    private final String dummyHash;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, TokenService tokens,
                       LoginAttemptService attempts) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.attempts = attempts;
        this.dummyHash = passwordEncoder.encode("batchwise-timing-dummy");
    }

    public LoginResponse login(LoginRequest req, String clientIp) {
        String username = req.username().trim().toLowerCase();
        attempts.checkAllowed(username, clientIp);

        AppUser user = users.findByUsernameIgnoreCase(username).orElse(null);
        boolean passwordOk = passwordEncoder.matches(req.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !passwordOk || !user.isActive()) {
            attempts.recordFailure(username, clientIp);
            log.warn("Failed login for '{}' from {}", safe(username), safe(clientIp));
            throw new AuthenticationFailedException(BAD_LOGIN);
        }
        attempts.recordSuccess(username, clientIp);
        user.setLastLoginAt(LocalDateTime.now());
        return respond(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return UserResponse.from(get(userId));
    }

    /** Changes the caller's own password and returns a fresh token (older tokens stop working). */
    public LoginResponse changePassword(Long userId, ChangePasswordRequest req) {
        AppUser user = get(userId);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new InvalidFieldException("currentPassword", "Current password is incorrect");
        }
        if (req.currentPassword().equals(req.newPassword())) {
            throw new InvalidFieldException("newPassword", "New password must be different from the current one");
        }
        PasswordPolicy.check(req.newPassword(), user.getUsername(), "newPassword");
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        return respond(user);
    }

    private LoginResponse respond(AppUser user) {
        TokenService.IssuedToken t = tokens.issue(user);
        return new LoginResponse(t.token(), t.expiresAt(), UserResponse.from(user));
    }

    /** Strip line breaks so user input cannot forge extra log lines. */
    private static String safe(String s) {
        String t = s == null ? "" : s.replaceAll("[\\r\\n\\t]", "_");
        return t.length() > 60 ? t.substring(0, 60) + "…" : t;
    }

    private AppUser get(Long userId) {
        return users.findById(userId).orElseThrow(() -> new AuthenticationFailedException("Account no longer exists"));
    }
}
