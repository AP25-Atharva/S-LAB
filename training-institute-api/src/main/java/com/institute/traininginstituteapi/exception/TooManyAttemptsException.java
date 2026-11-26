package com.institute.traininginstituteapi.exception;

/** 429 - too many failed logins for one username; try again later. */
public class TooManyAttemptsException extends RuntimeException {
    public TooManyAttemptsException(String message) {
        super(message);
    }
}
