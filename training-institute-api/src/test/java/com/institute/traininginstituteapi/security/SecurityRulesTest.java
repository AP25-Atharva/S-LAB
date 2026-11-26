package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.controller.HealthController;
import com.institute.traininginstituteapi.controller.TrainerController;
import com.institute.traininginstituteapi.controller.UserController;
import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.entity.UserRole;
import com.institute.traininginstituteapi.repository.AppUserRepository;
import com.institute.traininginstituteapi.service.TrainerService;
import com.institute.traininginstituteapi.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Who may call what: no token -> 401, STAFF cannot delete or manage users, ADMIN can. */
@WebMvcTest(controllers = {TrainerController.class, UserController.class, HealthController.class})
@Import({SecurityConfig.class, JsonSecurityErrorHandler.class, UserJwtAuthenticationConverter.class, TokenService.class})
class SecurityRulesTest {

    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;

    @MockitoBean TrainerService trainerService;
    @MockitoBean UserService userService;
    @MockitoBean AppUserRepository users;

    private AppUser admin;
    private AppUser staff;

    @BeforeEach
    void setUp() {
        admin = user(1L, "admin", UserRole.ADMIN);
        staff = user(2L, "staff", UserRole.STAFF);
        when(users.findById(1L)).thenReturn(Optional.of(admin));
        when(users.findById(2L)).thenReturn(Optional.of(staff));
        when(trainerService.findAll(null, null)).thenReturn(List.of());
        when(userService.findAll()).thenReturn(List.of());
    }

    private static AppUser user(Long id, String name, UserRole role) {
        AppUser u = new AppUser();
        u.setUserId(id);
        u.setUsername(name);
        u.setFullName(name);
        u.setRole(role);
        u.setActive(true);
        u.setPasswordHash("x");
        u.setPasswordChangedAt(LocalDateTime.now().minusDays(1));
        return u;
    }

    private String bearer(AppUser u) {
        return "Bearer " + tokens.issue(u).token();
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void noTokenIsRejectedWithJson401() throws Exception {
        mvc.perform(get("/api/trainers"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please log in to continue"));
    }

    @Test
    void garbageTokenIsRejected() throws Exception {
        mvc.perform(get("/api/trainers").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void staffCanReadButNotDeleteOrManageUsers() throws Exception {
        mvc.perform(get("/api/trainers").header("Authorization", bearer(staff))).andExpect(status().isOk());
        mvc.perform(delete("/api/trainers/5").header("Authorization", bearer(staff))).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", bearer(staff))).andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteAndManageUsers() throws Exception {
        mvc.perform(delete("/api/trainers/5").header("Authorization", bearer(admin))).andExpect(status().isNoContent());
        mvc.perform(get("/api/users").header("Authorization", bearer(admin))).andExpect(status().isOk());
    }

    @Test
    void deactivatedUserIsLoggedOutImmediately() throws Exception {
        String token = bearer(staff);
        staff.setActive(false);
        mvc.perform(get("/api/trainers").header("Authorization", token)).andExpect(status().isUnauthorized());
    }

    @Test
    void roleComesFromDatabaseNotToken() throws Exception {
        String token = bearer(admin);
        admin.setRole(UserRole.STAFF);
        mvc.perform(delete("/api/trainers/5").header("Authorization", token)).andExpect(status().isForbidden());
    }

    @Test
    void tokenIssuedBeforePasswordChangeIsRejected() throws Exception {
        String token = bearer(staff);
        staff.setPasswordChangedAt(LocalDateTime.now().plusMinutes(1));
        mvc.perform(get("/api/trainers").header("Authorization", token)).andExpect(status().isUnauthorized());
    }
}
