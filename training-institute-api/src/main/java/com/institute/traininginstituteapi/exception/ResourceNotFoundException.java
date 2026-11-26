package com.institute.traininginstituteapi.exception;

/** 404 - the requested record does not exist. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id " + id);
    }
}
