package com.institute.traininginstituteapi.dto;

import com.institute.traininginstituteapi.entity.Student;
import com.institute.traininginstituteapi.entity.StudentStatus;

import java.time.LocalDate;

public record StudentResponse(
        Long studentId,
        String studentCode,
        String fullName,
        String email,
        String phone,
        String qualification,
        LocalDate registrationDate,
        StudentStatus status) {

    public static StudentResponse from(Student s) {
        return new StudentResponse(s.getStudentId(), s.getStudentCode(), s.getFullName(), s.getEmail(),
                s.getPhone(), s.getQualification(), s.getRegistrationDate(), s.getStatus());
    }
}
