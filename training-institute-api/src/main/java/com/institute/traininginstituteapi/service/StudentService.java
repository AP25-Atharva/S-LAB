package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.StudentRequest;
import com.institute.traininginstituteapi.dto.StudentResponse;
import com.institute.traininginstituteapi.entity.Student;
import com.institute.traininginstituteapi.entity.StudentStatus;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.DuplicateResourceException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.EnrolmentRepository;
import com.institute.traininginstituteapi.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final EnrolmentRepository enrolmentRepository;

    public StudentService(StudentRepository studentRepository, EnrolmentRepository enrolmentRepository) {
        this.studentRepository = studentRepository;
        this.enrolmentRepository = enrolmentRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> findAll(String search, StudentStatus status) {
        return studentRepository.search(Text.clean(search), status).stream().map(StudentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse findById(Long id) {
        return StudentResponse.from(getEntity(id));
    }

    public StudentResponse create(StudentRequest req) {
        String code = Text.code(req.studentCode());
        String email = Text.email(req.email());
        if (studentRepository.existsByStudentCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("studentCode", "Student code " + code + " already exists");
        }
        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("email", "A student with email " + email + " already exists");
        }
        Student student = new Student();
        apply(student, req, code, email);
        return StudentResponse.from(studentRepository.save(student));
    }

    public StudentResponse update(Long id, StudentRequest req) {
        Student student = getEntity(id);
        String code = Text.code(req.studentCode());
        String email = Text.email(req.email());
        if (studentRepository.existsByStudentCodeIgnoreCaseAndStudentIdNot(code, id)) {
            throw new DuplicateResourceException("studentCode", "Student code " + code + " already exists");
        }
        if (studentRepository.existsByEmailIgnoreCaseAndStudentIdNot(email, id)) {
            throw new DuplicateResourceException("email", "A student with email " + email + " already exists");
        }
        apply(student, req, code, email);
        return StudentResponse.from(student);
    }

    /** Soft delete / reactivate. Inactive students cannot be enrolled. */
    public StudentResponse setStatus(Long id, StudentStatus status) {
        Student student = getEntity(id);
        student.setStatus(status);
        return StudentResponse.from(student);
    }

    public void delete(Long id) {
        Student student = getEntity(id);
        if (enrolmentRepository.existsByStudentStudentId(id)) {
            throw new BusinessRuleException("Student " + student.getStudentCode()
                    + " has enrolment history and cannot be deleted. Mark the student INACTIVE instead.");
        }
        studentRepository.delete(student);
    }

    Student getEntity(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Student", id));
    }

    private void apply(Student student, StudentRequest req, String code, String email) {
        student.setStudentCode(code);
        student.setFullName(Text.clean(req.fullName()));
        student.setEmail(email);
        student.setPhone(Text.clean(req.phone()));
        student.setQualification(Text.clean(req.qualification()));
        student.setRegistrationDate(req.registrationDate());
        if (req.status() != null) student.setStatus(req.status());
    }
}
