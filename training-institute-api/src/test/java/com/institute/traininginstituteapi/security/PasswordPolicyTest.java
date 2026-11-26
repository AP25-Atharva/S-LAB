package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.exception.InvalidFieldException;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyTest {

    @ParameterizedTest
    @ValueSource(strings = {"short1", "onlyletterslong", "12345678901", "Password123", "riya.staff99", "1234567890"})
    void rejectsWeakPasswords(String password) {
        assertThatThrownBy(() -> PasswordPolicy.check(password, "riya.staff", "password"))
                .isInstanceOf(InvalidFieldException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Batch#Wise2026", "green-tiger-47", "Correct9HorseBattery"})
    void acceptsReasonablePasswords(String password) {
        assertThatCode(() -> PasswordPolicy.check(password, "riya.staff", "password")).doesNotThrowAnyException();
    }
}
