package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRoleAndActiveTrue(UserRole role);

    List<AppUser> findAllByOrderByUserIdAsc();
}
