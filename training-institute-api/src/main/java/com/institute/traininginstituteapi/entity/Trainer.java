package com.institute.traininginstituteapi.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "trainer")
public class Trainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trainer_id")
    private Long trainerId;

    @Column(name = "trainer_code", nullable = false, unique = true, length = 20)
    private String trainerCode;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 150)
    private String expertise;

    @Column(nullable = false, columnDefinition = "tinyint(1)")
    private boolean active = true;

    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }
    public String getTrainerCode() { return trainerCode; }
    public void setTrainerCode(String trainerCode) { this.trainerCode = trainerCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
