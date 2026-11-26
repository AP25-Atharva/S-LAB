package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.Student;
import com.institute.traininginstituteapi.entity.StudentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByStudentCodeIgnoreCase(String studentCode);

    boolean existsByStudentCodeIgnoreCaseAndStudentIdNot(String studentCode, Long studentId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndStudentIdNot(String email, Long studentId);

    long countByStatus(StudentStatus status);

    @Query("""
            SELECT s FROM Student s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:search IS NULL
                   OR LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR s.phone LIKE CONCAT('%', :search, '%'))
            ORDER BY s.studentId DESC
            """)
    List<Student> search(@Param("search") String search, @Param("status") StudentStatus status);
}
