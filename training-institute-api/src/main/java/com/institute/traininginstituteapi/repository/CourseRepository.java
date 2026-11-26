package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    boolean existsByCourseCodeIgnoreCase(String courseCode);

    boolean existsByCourseCodeIgnoreCaseAndCourseIdNot(String courseCode, Long courseId);

    long countByActiveTrue();

    @Query("""
            SELECT c FROM Course c
            WHERE (:active IS NULL OR c.active = :active)
              AND (:search IS NULL
                   OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.category) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY c.courseId DESC
            """)
    List<Course> search(@Param("search") String search, @Param("active") Boolean active);
}
