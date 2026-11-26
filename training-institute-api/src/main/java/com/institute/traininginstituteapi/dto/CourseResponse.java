package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.Course;

import java.math.BigDecimal;

public record CourseResponse(
        Long courseId,
        String courseCode,
        String title,
        String category,
        Integer durationHours,
        BigDecimal fee,
        String description,
        boolean active) {

    public static CourseResponse from(Course c) {
        return new CourseResponse(c.getCourseId(), c.getCourseCode(), c.getTitle(), c.getCategory(),
                c.getDurationHours(), c.getFee(), c.getDescription(), c.isActive());
    }
}
