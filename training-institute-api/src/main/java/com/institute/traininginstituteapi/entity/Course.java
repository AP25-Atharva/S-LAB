package com.institute.traininginstituteapi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "course")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "course_code", nullable = false, unique = true, length = 20)
    private String courseCode;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fee;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false, columnDefinition = "tinyint(1)")
    private boolean active = true;

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }
    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
