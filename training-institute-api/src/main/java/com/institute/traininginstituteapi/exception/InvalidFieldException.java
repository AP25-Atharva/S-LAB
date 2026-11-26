package com.institute.traininginstituteapi.exception;

/** 400 - one specific field is wrong (e.g. "current password is incorrect"). Shown next to that field. */
public class InvalidFieldException extends RuntimeException {
    private final String field;

    public InvalidFieldException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() { return field; }
}
