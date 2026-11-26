package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.StudentRequest;
import com.institute.traininginstituteapi.dto.StudentResponse;
import com.institute.traininginstituteapi.entity.StudentStatus;
import com.institute.traininginstituteapi.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public List<StudentResponse> list(@RequestParam(required = false) String search,
                                      @RequestParam(required = false) StudentStatus status) {
        return studentService.findAll(search, status);
    }

    @GetMapping("/{id}")
    public StudentResponse get(@PathVariable Long id) {
        return studentService.findById(id);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request) {
        StudentResponse created = studentService.create(request);
        return ResponseEntity.created(URI.create("/api/students/" + created.studentId())).body(created);
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return studentService.update(id, request);
    }

    /** PATCH /api/students/7/status?status=INACTIVE */
    @PatchMapping("/{id}/status")
    public StudentResponse changeStatus(@PathVariable Long id, @RequestParam StudentStatus status) {
        return studentService.setStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        studentService.delete(id);
    }
}
