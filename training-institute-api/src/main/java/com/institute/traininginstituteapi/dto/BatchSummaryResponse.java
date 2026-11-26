package com.institute.traininginstituteapi.dto;

import java.math.BigDecimal;
import java.util.List;

/** Batch detail page: batch info, capacity usage and the full roster. */
public record BatchSummaryResponse(
        BatchResponse batch,
        BigDecimal averageAttendance,
        List<EnrolmentResponse> roster) {
}
