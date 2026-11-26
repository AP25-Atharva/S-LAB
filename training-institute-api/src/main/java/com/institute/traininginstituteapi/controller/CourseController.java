package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.CourseRequest;
import com.institute.traininginstituteapi.dto.CourseResponse;
import com.institute.traininginstituteapi.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<CourseResponse> list(@RequestParam(required = false) String search,
                                     @RequestParam(required = false) Boolean active) {
        return courseService.findAll(search, active);
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable Long id) {
        return courseService.findById(id);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request) {
        CourseResponse created = courseService.create(request);
        return ResponseEntity.created(URI.create("/api/courses/" + created.courseId())).body(created);
    }

    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return courseService.update(id, request);
    }

    /** Activate / deactivate: PATCH /api/courses/5/status?active=false */
    @PatchMapping("/{id}/status")
    public CourseResponse changeStatus(@PathVariable Long id, @RequestParam boolean active) {
        return courseService.setActive(id, active);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }
}
