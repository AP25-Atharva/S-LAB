package com.institute.traininginstituteapi.dto;

import java.util.List;

public record DashboardResponse(
        long totalCourses,
        long activeCourses,
        long activeTrainers,
        long activeStudents,
        long plannedBatches,
        long runningBatches,
        long completedBatches,
        long cancelledBatches,
        long enrolledCount,
        long waitlistedCount,
        long completedCount,
        long withdrawnCount,
        List<BatchResponse> runningBatchList,
        List<BatchResponse> upcomingBatches,
        List<BatchResponse> delayedBatches) {
}
