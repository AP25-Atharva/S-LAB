package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.Trainer;

public record TrainerResponse(
        Long trainerId,
        String trainerCode,
        String fullName,
        String email,
        String phone,
        String expertise,
        boolean active,
        long activeBatchCount) {

    public static TrainerResponse from(Trainer t, long activeBatchCount) {
        return new TrainerResponse(t.getTrainerId(), t.getTrainerCode(), t.getFullName(), t.getEmail(),
                t.getPhone(), t.getExpertise(), t.isActive(), activeBatchCount);
    }
}
