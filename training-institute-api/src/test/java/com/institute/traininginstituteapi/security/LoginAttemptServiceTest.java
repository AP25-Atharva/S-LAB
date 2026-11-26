package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.TooManyAttemptsException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    @Test
    void locksAfterFiveFailuresAndUnlocksOnSuccess() {
        LoginAttemptService s = new LoginAttemptService();
        for (int i = 0; i < LoginAttemptService.MAX_FAILURES - 1; i++) s.recordFailure("bob");
        assertThatCode(() -> s.checkAllowed("bob")).doesNotThrowAnyException();

        s.recordFailure("bob");
        assertThatThrownBy(() -> s.checkAllowed("bob")).isInstanceOf(TooManyAttemptsException.class);
        assertThatCode(() -> s.checkAllowed("alice")).doesNotThrowAnyException();

        s.recordSuccess("bob");
        assertThatCode(() -> s.checkAllowed("bob")).doesNotThrowAnyException();
    }
}
