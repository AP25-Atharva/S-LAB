package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.TooManyAttemptsException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing: after 5 failed logins for a username within 15 minutes,
 * that username is locked until the 15 minutes are over. In-memory, so it resets on restart.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private record Attempts(int failures, Instant firstFailure) {
        boolean expired(Instant now) {
            return now.isAfter(firstFailure.plus(WINDOW));
        }
    }

    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void checkAllowed(String username) {
        Instant now = Instant.now();
        Attempts a = attempts.get(username);
        if (a == null) return;
        if (a.expired(now)) {
            attempts.remove(username, a);
            return;
        }
        if (a.failures() >= MAX_FAILURES) {
            long minutes = Math.max(1, Duration.between(now, a.firstFailure().plus(WINDOW)).toMinutes() + 1);
            throw new TooManyAttemptsException("Too many failed login attempts. Try again in " + minutes + " minute(s).");
        }
    }

    public void recordFailure(String username) {
        Instant now = Instant.now();
        attempts.compute(username, (k, a) ->
                a == null || a.expired(now) ? new Attempts(1, now) : new Attempts(a.failures() + 1, a.firstFailure()));
    }

    public void recordSuccess(String username) {
        attempts.remove(username);
    }
}
