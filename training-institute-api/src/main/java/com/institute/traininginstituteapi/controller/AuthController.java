package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.ChangePasswordRequest;
import com.institute.traininginstituteapi.dto.LoginRequest;
import com.institute.traininginstituteapi.dto.LoginResponse;
import com.institute.traininginstituteapi.dto.UserResponse;
import com.institute.traininginstituteapi.security.CurrentUser;
import com.institute.traininginstituteapi.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Public. Returns a token to send as "Authorization: Bearer <token>". */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.id(jwt));
    }

    @PostMapping("/change-password")
    public LoginResponse changePassword(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(CurrentUser.id(jwt), request);
    }
}
