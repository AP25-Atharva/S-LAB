package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.EnrolmentRequest;
import com.institute.traininginstituteapi.dto.EnrolmentResponse;
import com.institute.traininginstituteapi.entity.EnrolmentStatus;
import com.institute.traininginstituteapi.service.EnrolmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/enrolments")
public class EnrolmentController {

    private final EnrolmentService enrolmentService;

    public EnrolmentController(EnrolmentService enrolmentService) {
        this.enrolmentService = enrolmentService;
    }

    @GetMapping
    public List<EnrolmentResponse> list(@RequestParam(required = false) String search,
                                        @RequestParam(required = false) EnrolmentStatus status,
                                        @RequestParam(required = false) Long batchId,
                                        @RequestParam(required = false) Long studentId) {
        return enrolmentService.findAll(search, status, batchId, studentId);
    }

    @GetMapping("/{id}")
    public EnrolmentResponse get(@PathVariable Long id) {
        return enrolmentService.findById(id);
    }

    @PostMapping
    public ResponseEntity<EnrolmentResponse> create(@Valid @RequestBody EnrolmentRequest request) {
        EnrolmentResponse created = enrolmentService.create(request);
        return ResponseEntity.created(URI.create("/api/enrolments/" + created.enrolmentId())).body(created);
    }

    @PutMapping("/{id}")
    public EnrolmentResponse update(@PathVariable Long id, @Valid @RequestBody EnrolmentRequest request) {
        return enrolmentService.update(id, request);
    }

    /** PATCH /api/enrolments/4/status?status=WITHDRAWN */
    @PatchMapping("/{id}/status")
    public EnrolmentResponse changeStatus(@PathVariable Long id, @RequestParam EnrolmentStatus status) {
        return enrolmentService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        enrolmentService.delete(id);
    }
}
