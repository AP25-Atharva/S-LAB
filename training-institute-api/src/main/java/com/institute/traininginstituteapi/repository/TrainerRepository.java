package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrainerRepository extends JpaRepository<Trainer, Long> {

    boolean existsByTrainerCodeIgnoreCase(String trainerCode);

    boolean existsByTrainerCodeIgnoreCaseAndTrainerIdNot(String trainerCode, Long trainerId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndTrainerIdNot(String email, Long trainerId);

    long countByActiveTrue();

    @Query("""
            SELECT t FROM Trainer t
            WHERE (:active IS NULL OR t.active = :active)
              AND (:search IS NULL
                   OR LOWER(t.trainerCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.expertise) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY t.trainerId DESC
            """)
    List<Trainer> search(@Param("search") String search, @Param("active") Boolean active);
}
