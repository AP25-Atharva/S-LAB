package com.institute.traininginstituteapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Seat usage of a batch. ENROLLED and COMPLETED students occupy a seat;
 * WAITLISTED and WITHDRAWN do not.
 */
public record SeatCounts(
        long enrolled,
        long waitlisted,
        long completed,
        long withdrawn,
        int capacity) {

    @JsonProperty("occupied")
    public long occupied() {
        return enrolled + completed;
    }

    @JsonProperty("available")
    public long available() {
        return Math.max(0, capacity - occupied());
    }

    @JsonProperty("full")
    public boolean full() {
        return occupied() >= capacity;
    }

    @JsonProperty("occupancyPercent")
    public double occupancyPercent() {
        return capacity == 0 ? 0 : Math.round(occupied() * 1000.0 / capacity) / 10.0;
    }
}
