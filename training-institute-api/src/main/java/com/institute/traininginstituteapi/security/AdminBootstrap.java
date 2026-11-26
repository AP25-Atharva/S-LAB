package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.entity.UserRole;
import com.institute.traininginstituteapi.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Creates the first admin account from ADMIN_USERNAME / ADMIN_PASSWORD, but only while the user table is empty.
 * Once any user exists these variables are ignored, so they can be removed after the first login.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String fullName;

    public AdminBootstrap(AppUserRepository users, PasswordEncoder passwordEncoder,
                          @Value("${app.bootstrap.admin-username:admin}") String username,
                          @Value("${app.bootstrap.admin-password:}") String password,
                          @Value("${app.bootstrap.admin-full-name:Administrator}") String fullName) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) return;
        if (password == null || password.isBlank()) {
            log.warn("No user accounts exist yet. Set ADMIN_USERNAME and ADMIN_PASSWORD and restart to create the first admin.");
            return;
        }
        String name = username == null ? "" : username.trim().toLowerCase();
        if (!name.matches("^[a-z0-9._-]{3,50}$")) {
            log.error("ADMIN_USERNAME '{}' is invalid (3-50 letters, digits, '.', '-' or '_', no spaces) - first admin was NOT created.",
                    username);
            return;
        }
        try {
            PasswordPolicy.check(password, name, "ADMIN_PASSWORD");
        } catch (RuntimeException e) {
            log.error("ADMIN_PASSWORD rejected ({}) - first admin was NOT created.", e.getMessage());
            return;
        }
        AppUser admin = new AppUser();
        admin.setUsername(name);
        admin.setFullName(fullName.trim());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(UserRole.ADMIN);
        admin.setActive(true);
        admin.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        users.save(admin);
        log.info("Created first admin account '{}'. Log in and change the password.", admin.getUsername());
    }
}
