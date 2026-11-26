package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.SeatCounts;
import com.institute.traininginstituteapi.entity.Batch;
import com.institute.traininginstituteapi.entity.EnrolmentStatus;
import com.institute.traininginstituteapi.repository.EnrolmentRepository;
import org.springframework.stereotype.Component;

import java.util.*;

/** Works out seat usage per batch from enrolment counts. */
@Component
public class SeatCalculator {

    private final EnrolmentRepository enrolmentRepository;

    public SeatCalculator(EnrolmentRepository enrolmentRepository) {
        this.enrolmentRepository = enrolmentRepository;
    }

    public SeatCounts forBatch(Batch batch) {
        return forBatches(List.of(batch)).get(batch.getBatchId());
    }

    /** One grouped query for any number of batches. */
    public Map<Long, SeatCounts> forBatches(Collection<Batch> batches) {
        Map<Long, SeatCounts> result = new HashMap<>();
        if (batches.isEmpty()) return result;

        Map<Long, EnumMap<EnrolmentStatus, Long>> counts = new HashMap<>();
        List<Long> ids = batches.stream().map(Batch::getBatchId).toList();
        for (Object[] row : enrolmentRepository.countByBatchAndStatus(ids)) {
            counts.computeIfAbsent((Long) row[0], k -> new EnumMap<>(EnrolmentStatus.class))
                    .put((EnrolmentStatus) row[1], (Long) row[2]);
        }
        for (Batch b : batches) {
            Map<EnrolmentStatus, Long> c = counts.getOrDefault(b.getBatchId(), new EnumMap<>(EnrolmentStatus.class));
            result.put(b.getBatchId(), new SeatCounts(
                    c.getOrDefault(EnrolmentStatus.ENROLLED, 0L),
                    c.getOrDefault(EnrolmentStatus.WAITLISTED, 0L),
                    c.getOrDefault(EnrolmentStatus.COMPLETED, 0L),
                    c.getOrDefault(EnrolmentStatus.WITHDRAWN, 0L),
                    b.getCapacity()));
        }
        return result;
    }
}
