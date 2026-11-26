package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.BatchRequest;
import com.institute.traininginstituteapi.dto.BatchResponse;
import com.institute.traininginstituteapi.dto.BatchSummaryResponse;
import com.institute.traininginstituteapi.entity.BatchStatus;
import com.institute.traininginstituteapi.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public List<BatchResponse> list(@RequestParam(required = false) String search,
                                    @RequestParam(required = false) BatchStatus status,
                                    @RequestParam(required = false) Long courseId,
                                    @RequestParam(required = false) Long trainerId) {
        return batchService.findAll(search, status, courseId, trainerId);
    }

    @GetMapping("/{id}")
    public BatchResponse get(@PathVariable Long id) {
        return batchService.findById(id);
    }

    /** Batch summary: capacity usage, average attendance and roster. */
    @GetMapping("/{id}/summary")
    public BatchSummaryResponse summary(@PathVariable Long id) {
        return batchService.summary(id);
    }

    @PostMapping
    public ResponseEntity<BatchResponse> create(@Valid @RequestBody BatchRequest request) {
        BatchResponse created = batchService.create(request);
        return ResponseEntity.created(URI.create("/api/batches/" + created.batchId())).body(created);
    }

    @PutMapping("/{id}")
    public BatchResponse update(@PathVariable Long id, @Valid @RequestBody BatchRequest request) {
        return batchService.update(id, request);
    }

    /** PATCH /api/batches/2/status?status=CANCELLED */
    @PatchMapping("/{id}/status")
    public BatchResponse changeStatus(@PathVariable Long id, @RequestParam BatchStatus status) {
        return batchService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        batchService.delete(id);
    }
}
