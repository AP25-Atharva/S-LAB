package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.UserCreateRequest;
import com.institute.traininginstituteapi.dto.UserResponse;
import com.institute.traininginstituteapi.dto.UserUpdateRequest;
import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.entity.UserRole;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.DuplicateResourceException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.AppUserRepository;
import com.institute.traininginstituteapi.security.PasswordPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** Admin-only management of staff accounts. There must always be at least one active admin. */
@Service
@Transactional
public class UserService {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return users.findAllByOrderByUserIdAsc().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return UserResponse.from(get(id));
    }

    public UserResponse create(UserCreateRequest req) {
        String username = req.username().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("username", "Username " + username + " is already taken");
        }
        PasswordPolicy.check(req.password(), username, "password");
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setFullName(Text.clean(req.fullName()));
        user.setRole(req.role());
        user.setActive(req.active() == null || req.active());
        setPassword(user, req.password());
        return UserResponse.from(users.save(user));
    }

    public UserResponse update(Long id, UserUpdateRequest req, Long currentUserId) {
        AppUser user = get(id);
        boolean losesAdmin = user.getRole() == UserRole.ADMIN && user.isActive()
                && (req.role() != UserRole.ADMIN || !req.active());
        if (losesAdmin && id.equals(currentUserId)) {
            throw new BusinessRuleException("You cannot remove your own admin role or deactivate your own account.");
        }
        if (losesAdmin) ensureAnotherActiveAdmin();
        user.setFullName(Text.clean(req.fullName()));
        user.setRole(req.role());
        user.setActive(req.active());
        return UserResponse.from(user);
    }

    public void resetPassword(Long id, String newPassword) {
        AppUser user = get(id);
        PasswordPolicy.check(newPassword, user.getUsername(), "newPassword");
        setPassword(user, newPassword);
    }

    public void delete(Long id, Long currentUserId) {
        AppUser user = get(id);
        if (id.equals(currentUserId)) {
            throw new BusinessRuleException("You cannot delete your own account.");
        }
        if (user.getRole() == UserRole.ADMIN && user.isActive()) ensureAnotherActiveAdmin();
        users.delete(user);
    }

    private void ensureAnotherActiveAdmin() {
        if (users.countByRoleAndActiveTrue(UserRole.ADMIN) <= 1) {
            throw new BusinessRuleException("At least one active admin is required.");
        }
    }

    private void setPassword(AppUser user, String rawPassword) {
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
    }

    private AppUser get(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
