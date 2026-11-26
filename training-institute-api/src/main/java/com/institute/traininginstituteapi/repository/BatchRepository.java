package com.institute.traininginstituteapi.repository;

import com.institute.traininginstituteapi.entity.Batch;
import com.institute.traininginstituteapi.entity.BatchStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    boolean existsByBatchCodeIgnoreCase(String batchCode);

    boolean existsByBatchCodeIgnoreCaseAndBatchIdNot(String batchCode, Long batchId);

    boolean existsByCourseCourseId(Long courseId);

    boolean existsByTrainerTrainerId(Long trainerId);

    long countByStatus(BatchStatus status);

    /** Locks the batch row so concurrent enrolments cannot both take the last seat. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Batch b WHERE b.batchId = :id")
    Optional<Batch> findByIdForUpdate(@Param("id") Long id);

    long countByTrainerTrainerIdAndStatusIn(Long trainerId, List<BatchStatus> statuses);

    @Query("""
            SELECT b FROM Batch b JOIN FETCH b.course c JOIN FETCH b.trainer t
            WHERE (:status IS NULL OR b.status = :status)
              AND (:courseId IS NULL OR c.courseId = :courseId)
              AND (:trainerId IS NULL OR t.trainerId = :trainerId)
              AND (:search IS NULL
                   OR LOWER(b.batchCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY b.startDate DESC, b.batchId DESC
            """)
    List<Batch> search(@Param("search") String search,
                       @Param("status") BatchStatus status,
                       @Param("courseId") Long courseId,
                       @Param("trainerId") Long trainerId);

    /** Trainer's other live batches whose dates overlap [start, end] - used to prevent double booking. */
    @Query("""
            SELECT COUNT(b) FROM Batch b
            WHERE b.trainer.trainerId = :trainerId
              AND b.status IN (com.institute.traininginstituteapi.entity.BatchStatus.PLANNED,
                               com.institute.traininginstituteapi.entity.BatchStatus.RUNNING)
              AND b.startDate <= :endDate AND b.endDate >= :startDate
              AND (:excludeBatchId IS NULL OR b.batchId <> :excludeBatchId)
            """)
    long countOverlappingForTrainer(@Param("trainerId") Long trainerId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("excludeBatchId") Long excludeBatchId);

    @Query("""
            SELECT b FROM Batch b JOIN FETCH b.course JOIN FETCH b.trainer
            WHERE b.status = com.institute.traininginstituteapi.entity.BatchStatus.PLANNED
              AND b.startDate BETWEEN :from AND :to
            ORDER BY b.startDate
            """)
    List<Batch> findUpcoming(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** Batches still PLANNED although their start date has passed. */
    @Query("""
            SELECT b FROM Batch b JOIN FETCH b.course JOIN FETCH b.trainer
            WHERE b.status = com.institute.traininginstituteapi.entity.BatchStatus.PLANNED
              AND b.startDate < :today
            ORDER BY b.startDate
            """)
    List<Batch> findDelayed(@Param("today") LocalDate today);
}
