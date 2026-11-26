package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.TrainerRequest;
import com.institute.traininginstituteapi.dto.TrainerResponse;
import com.institute.traininginstituteapi.service.TrainerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerService trainerService;

    public TrainerController(TrainerService trainerService) {
        this.trainerService = trainerService;
    }

    @GetMapping
    public List<TrainerResponse> list(@RequestParam(required = false) String search,
                                      @RequestParam(required = false) Boolean active) {
        return trainerService.findAll(search, active);
    }

    @GetMapping("/{id}")
    public TrainerResponse get(@PathVariable Long id) {
        return trainerService.findById(id);
    }

    @PostMapping
    public ResponseEntity<TrainerResponse> create(@Valid @RequestBody TrainerRequest request) {
        TrainerResponse created = trainerService.create(request);
        return ResponseEntity.created(URI.create("/api/trainers/" + created.trainerId())).body(created);
    }

    @PutMapping("/{id}")
    public TrainerResponse update(@PathVariable Long id, @Valid @RequestBody TrainerRequest request) {
        return trainerService.update(id, request);
    }

    /** Activate / deactivate: PATCH /api/trainers/3/status?active=false */
    @PatchMapping("/{id}/status")
    public TrainerResponse changeStatus(@PathVariable Long id, @RequestParam boolean active) {
        return trainerService.setActive(id, active);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        trainerService.delete(id);
    }
}
