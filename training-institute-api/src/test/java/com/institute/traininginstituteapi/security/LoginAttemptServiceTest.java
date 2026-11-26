package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.TooManyAttemptsException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    @Test
    void strangerCannotLockOutTheRealUserFromAnotherNetwork() {
        LoginAttemptService s = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_PER_USER_AND_IP; i++) s.recordFailure("admin", "6.6.6.6");

        assertThatThrownBy(() -> s.checkAllowed("admin", "6.6.6.6")).isInstanceOf(TooManyAttemptsException.class);
        assertThatCode(() -> s.checkAllowed("admin", "1.2.3.4")).doesNotThrowAnyException();
    }

    @Test
    void oneIpGuessingManyUsernamesIsBlocked() {
        LoginAttemptService s = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_PER_IP; i++) s.recordFailure("user" + i, "6.6.6.6");

        assertThatThrownBy(() -> s.checkAllowed("someone-new", "6.6.6.6")).isInstanceOf(TooManyAttemptsException.class);
        assertThatCode(() -> s.checkAllowed("someone-new", "1.2.3.4")).doesNotThrowAnyException();
    }

    @Test
    void distributedAttackOnOneAccountIsCapped() {
        LoginAttemptService s = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_PER_USER; i++) s.recordFailure("admin", "10.0.0." + i);

        assertThatThrownBy(() -> s.checkAllowed("admin", "10.9.9.9")).isInstanceOf(TooManyAttemptsException.class);
    }

    @Test
    void successClearsThatUserAndIpPair() {
        LoginAttemptService s = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_PER_USER_AND_IP - 1; i++) s.recordFailure("bob", "1.2.3.4");
        s.recordSuccess("bob", "1.2.3.4");
        s.recordFailure("bob", "1.2.3.4");
        assertThatCode(() -> s.checkAllowed("bob", "1.2.3.4")).doesNotThrowAnyException();
    }
}
