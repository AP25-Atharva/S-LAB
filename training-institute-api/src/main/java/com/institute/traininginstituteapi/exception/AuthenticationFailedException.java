package com.institute.traininginstituteapi.exception;

/** 401 - wrong username/password, or the account is disabled. Message is deliberately generic. */
public class AuthenticationFailedException extends RuntimeException {
    public AuthenticationFailedException(String message) {
        super(message);
    }
}
