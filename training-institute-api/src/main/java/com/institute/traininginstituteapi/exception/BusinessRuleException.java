package com.institute.traininginstituteapi.exception;

/** 409 - the request is well-formed but breaks a business rule (full batch, dependent records...). */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
