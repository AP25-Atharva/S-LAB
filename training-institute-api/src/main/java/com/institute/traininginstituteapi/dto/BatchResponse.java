package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.Batch;
import com.institute.traininginstituteapi.entity.BatchMode;
import com.institute.traininginstituteapi.entity.BatchStatus;

import java.time.LocalDate;

public record BatchResponse(
        Long batchId,
        String batchCode,
        Long courseId,
        String courseCode,
        String courseTitle,
        Long trainerId,
        String trainerCode,
        String trainerName,
        LocalDate startDate,
        LocalDate endDate,
        BatchMode mode,
        Integer capacity,
        BatchStatus status,
        SeatCounts seats) {

    public static BatchResponse from(Batch b, SeatCounts seats) {
        return new BatchResponse(b.getBatchId(), b.getBatchCode(),
                b.getCourse().getCourseId(), b.getCourse().getCourseCode(), b.getCourse().getTitle(),
                b.getTrainer().getTrainerId(), b.getTrainer().getTrainerCode(), b.getTrainer().getFullName(),
                b.getStartDate(), b.getEndDate(), b.getMode(), b.getCapacity(), b.getStatus(), seats);
    }
}
