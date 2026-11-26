package com.institute.traininginstituteapi.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.institute.traininginstituteapi.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/** 401 / 403 responses in the same JSON shape as GlobalExceptionHandler, so the UI can show them. */
@Component
public class JsonSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper mapper;

    public JsonSecurityErrorHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) throws IOException {
        String message = ex instanceof InsufficientAuthenticationException
                ? "Please log in to continue"
                : "Your session has expired or is no longer valid. Please log in again.";
        write(res, req, HttpStatus.UNAUTHORIZED, message);
    }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) throws IOException {
        write(res, req, HttpStatus.FORBIDDEN, "You do not have permission to do this. Ask an admin.");
    }

    private void write(HttpServletResponse res, HttpServletRequest req, HttpStatus status, String message)
            throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse body = new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                message, req.getRequestURI(), null);
        mapper.writeValue(res.getOutputStream(), body);
    }
}
