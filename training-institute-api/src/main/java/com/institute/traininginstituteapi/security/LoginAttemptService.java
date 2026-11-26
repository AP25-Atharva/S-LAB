package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.TooManyAttemptsException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing with three limits, each over a 15-minute window:
 * <ul>
 *   <li>5 failures for one username from one IP address - blocks that pair only, so a stranger
 *       cannot lock the real user out from a different network;</li>
 *   <li>20 failures from one IP address across any usernames - stops one machine guessing many accounts;</li>
 *   <li>50 failures for one username from all IPs together - caps a distributed attack on one account.</li>
 * </ul>
 * Counters are in memory, so they reset when the app restarts.
 */
@Service
public class LoginAttemptService {

    static final int MAX_PER_USER_AND_IP = 5;
    static final int MAX_PER_IP = 20;
    static final int MAX_PER_USER = 50;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_TRACKED_KEYS = 10_000;

    private record Attempts(int failures, Instant firstFailure) {
        boolean expired(Instant now) {
            return now.isAfter(firstFailure.plus(WINDOW));
        }
    }

    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void checkAllowed(String username, String ip) {
        Instant now = Instant.now();
        check(userIpKey(username, ip), MAX_PER_USER_AND_IP, now);
        check(ipKey(ip), MAX_PER_IP, now);
        check(userKey(username), MAX_PER_USER, now);
    }

    public void recordFailure(String username, String ip) {
        Instant now = Instant.now();
        if (attempts.size() > MAX_TRACKED_KEYS) {
            attempts.entrySet().removeIf(e -> e.getValue().expired(now));
        }
        for (String key : new String[] {userIpKey(username, ip), ipKey(ip), userKey(username)}) {
            attempts.compute(key, (k, a) ->
                    a == null || a.expired(now) ? new Attempts(1, now) : new Attempts(a.failures() + 1, a.firstFailure()));
        }
    }

    /** A correct password clears the counter for that username and IP pair (not the IP or username totals). */
    public void recordSuccess(String username, String ip) {
        attempts.remove(userIpKey(username, ip));
    }

    private void check(String key, int max, Instant now) {
        Attempts a = attempts.get(key);
        if (a == null) return;
        if (a.expired(now)) {
            attempts.remove(key, a);
            return;
        }
        if (a.failures() >= max) {
            long minutes = Math.max(1, Duration.between(now, a.firstFailure().plus(WINDOW)).toMinutes() + 1);
            throw new TooManyAttemptsException("Too many failed login attempts. Try again in " + minutes + " minute(s).");
        }
    }

    private static String userIpKey(String username, String ip) { return "u+ip:" + username + "|" + ip; }
    private static String ipKey(String ip) { return "ip:" + ip; }
    private static String userKey(String username) { return "u:" + username; }
}
