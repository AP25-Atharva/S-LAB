package com.institute.traininginstituteapi.exception;

/** 409 - a unique business identifier (code / email) is already taken. */
public class DuplicateResourceException extends RuntimeException {
    private final String field;

    public DuplicateResourceException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() { return field; }
}
