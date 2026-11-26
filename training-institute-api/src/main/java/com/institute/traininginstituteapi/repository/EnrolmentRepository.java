package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.Enrolment;
import com.institute.traininginstituteapi.entity.EnrolmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface EnrolmentRepository extends JpaRepository<Enrolment, Long> {

    long countByBatchBatchIdAndStatusIn(Long batchId, Collection<EnrolmentStatus> statuses);

    long countByStatus(EnrolmentStatus status);

    boolean existsByBatchBatchId(Long batchId);

    boolean existsByStudentStudentId(Long studentId);

    boolean existsByBatchCourseCourseId(Long courseId);

    boolean existsByBatchTrainerTrainerId(Long trainerId);

    /** Is there already a live (ENROLLED / WAITLISTED) enrolment for this student in this batch? */
    @Query("""
            SELECT COUNT(e) > 0 FROM Enrolment e
            WHERE e.student.studentId = :studentId AND e.batch.batchId = :batchId
              AND e.status IN (com.institute.traininginstituteapi.entity.EnrolmentStatus.ENROLLED,
                               com.institute.traininginstituteapi.entity.EnrolmentStatus.WAITLISTED)
              AND (:excludeId IS NULL OR e.enrolmentId <> :excludeId)
            """)
    boolean existsActive(@Param("studentId") Long studentId,
                         @Param("batchId") Long batchId,
                         @Param("excludeId") Long excludeId);

    @Query("""
            SELECT e FROM Enrolment e
              JOIN FETCH e.student s
              JOIN FETCH e.batch b
              JOIN FETCH b.course c
            WHERE (:status IS NULL OR e.status = :status)
              AND (:batchId IS NULL OR b.batchId = :batchId)
              AND (:studentId IS NULL OR s.studentId = :studentId)
              AND (:search IS NULL
                   OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.batchCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY e.enrolmentDate DESC, e.enrolmentId DESC
            """)
    List<Enrolment> search(@Param("search") String search,
                           @Param("status") EnrolmentStatus status,
                           @Param("batchId") Long batchId,
                           @Param("studentId") Long studentId);

    /** Seat counts per batch: [batchId, status, count] - one query for list views. */
    @Query("""
            SELECT e.batch.batchId, e.status, COUNT(e) FROM Enrolment e
            WHERE e.batch.batchId IN :batchIds
            GROUP BY e.batch.batchId, e.status
            """)
    List<Object[]> countByBatchAndStatus(@Param("batchIds") Collection<Long> batchIds);
}
