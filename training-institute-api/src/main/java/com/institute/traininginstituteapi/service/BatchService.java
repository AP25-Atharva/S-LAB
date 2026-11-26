package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.*;
import com.institute.traininginstituteapi.entity.*;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.DuplicateResourceException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.BatchRepository;
import com.institute.traininginstituteapi.repository.EnrolmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional
public class BatchService {

    private final BatchRepository batchRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final CourseService courseService;
    private final TrainerService trainerService;
    private final SeatCalculator seatCalculator;

    public BatchService(BatchRepository batchRepository, EnrolmentRepository enrolmentRepository,
                        CourseService courseService, TrainerService trainerService, SeatCalculator seatCalculator) {
        this.batchRepository = batchRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.courseService = courseService;
        this.trainerService = trainerService;
        this.seatCalculator = seatCalculator;
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> findAll(String search, BatchStatus status, Long courseId, Long trainerId) {
        return toResponses(batchRepository.search(Text.clean(search), status, courseId, trainerId));
    }

    @Transactional(readOnly = true)
    public BatchResponse findById(Long id) {
        Batch batch = getEntity(id);
        return BatchResponse.from(batch, seatCalculator.forBatch(batch));
    }

    /** Batch detail: seats, average attendance and the roster. */
    @Transactional(readOnly = true)
    public BatchSummaryResponse summary(Long id) {
        Batch batch = getEntity(id);
        List<EnrolmentResponse> roster = enrolmentRepository.search(null, null, id, null).stream()
                .map(EnrolmentResponse::from).toList();
        List<BigDecimal> attendance = roster.stream()
                .filter(e -> e.status() == EnrolmentStatus.ENROLLED || e.status() == EnrolmentStatus.COMPLETED)
                .map(EnrolmentResponse::attendancePercentage).toList();
        BigDecimal avg = attendance.isEmpty() ? BigDecimal.ZERO
                : attendance.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(attendance.size()), 2, RoundingMode.HALF_UP);
        return new BatchSummaryResponse(BatchResponse.from(batch, seatCalculator.forBatch(batch)), avg, roster);
    }

    public BatchResponse create(BatchRequest req) {
        String code = Text.code(req.batchCode());
        if (batchRepository.existsByBatchCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("batchCode", "Batch code " + code + " already exists");
        }
        BatchStatus status = req.status() == null ? BatchStatus.PLANNED : req.status();
        if (status != BatchStatus.PLANNED && status != BatchStatus.RUNNING) {
            throw new BusinessRuleException("A new batch must be PLANNED or RUNNING");
        }
        Course course = activeCourse(req.courseId());
        Trainer trainer = activeTrainer(req.trainerId());
        ensureTrainerFree(trainer, req, status, null);

        Batch batch = new Batch();
        batch.setBatchCode(code);
        batch.setCourse(course);
        batch.setTrainer(trainer);
        applySchedule(batch, req, status);
        batch = batchRepository.save(batch);
        return BatchResponse.from(batch, seatCalculator.forBatch(batch));
    }

    public BatchResponse update(Long id, BatchRequest req) {
        Batch batch = getEntity(id);
        String code = Text.code(req.batchCode());
        if (batchRepository.existsByBatchCodeIgnoreCaseAndBatchIdNot(code, id)) {
            throw new DuplicateResourceException("batchCode", "Batch code " + code + " already exists");
        }
        BatchStatus status = req.status() == null ? batch.getStatus() : req.status();
        ensureTransitionAllowed(batch, status);
        SeatCounts seats = seatCalculator.forBatch(batch);

        if (!Objects.equals(batch.getCourse().getCourseId(), req.courseId())) {
            if (seats.enrolled() + seats.waitlisted() + seats.completed() > 0) {
                throw new BusinessRuleException("Course cannot be changed once students are enrolled in the batch");
            }
            batch.setCourse(activeCourse(req.courseId()));
        }
        if (!Objects.equals(batch.getTrainer().getTrainerId(), req.trainerId())) {
            batch.setTrainer(activeTrainer(req.trainerId()));
        }
        if (req.capacity() < seats.occupied()) {
            throw new BusinessRuleException("Capacity cannot be reduced to " + req.capacity()
                    + " because " + seats.occupied() + " seats are already taken");
        }
        ensureTrainerFree(batch.getTrainer(), req, status, id);

        batch.setBatchCode(code);
        if (status == BatchStatus.CANCELLED && batch.getStatus() != BatchStatus.CANCELLED) {
            withdrawActiveEnrolments(batch);
        }
        applySchedule(batch, req, status);
        return BatchResponse.from(batch, seatCalculator.forBatch(batch));
    }

    /**
     * Status change (PATCH). Cancelling a batch withdraws its ENROLLED / WAITLISTED students,
     * which is the "soft delete" for batches with enrolments.
     */
    public BatchResponse changeStatus(Long id, BatchStatus status) {
        Batch batch = getEntity(id);
        if (batch.getStatus() == status) {
            return BatchResponse.from(batch, seatCalculator.forBatch(batch));
        }
        ensureTransitionAllowed(batch, status);
        if (status == BatchStatus.CANCELLED) {
            withdrawActiveEnrolments(batch);
        }
        batch.setStatus(status);
        return BatchResponse.from(batch, seatCalculator.forBatch(batch));
    }

    public void delete(Long id) {
        Batch batch = getEntity(id);
        if (enrolmentRepository.existsByBatchBatchId(id)) {
            throw new BusinessRuleException("Batch " + batch.getBatchCode()
                    + " has enrolments and cannot be deleted. Cancel the batch instead.");
        }
        batchRepository.delete(batch);
    }

    Batch getEntity(Long id) {
        return batchRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Batch", id));
    }

    List<BatchResponse> toResponses(List<Batch> batches) {
        Map<Long, SeatCounts> seats = seatCalculator.forBatches(batches);
        return batches.stream().map(b -> BatchResponse.from(b, seats.get(b.getBatchId()))).toList();
    }

    /** CANCELLED and COMPLETED are final; such a batch cannot go back to PLANNED / RUNNING. */
    private void ensureTransitionAllowed(Batch batch, BatchStatus target) {
        boolean closed = batch.getStatus() == BatchStatus.CANCELLED || batch.getStatus() == BatchStatus.COMPLETED;
        boolean reopening = target == BatchStatus.PLANNED || target == BatchStatus.RUNNING;
        if (closed && reopening) {
            throw new BusinessRuleException("A " + batch.getStatus() + " batch cannot be reopened");
        }
    }

    private Course activeCourse(Long courseId) {
        Course course = courseService.getEntity(courseId);
        if (!course.isActive()) {
            throw new BusinessRuleException("Course " + course.getCourseCode() + " is inactive");
        }
        return course;
    }

    private Trainer activeTrainer(Long trainerId) {
        Trainer trainer = trainerService.getEntity(trainerId);
        if (!trainer.isActive()) {
            throw new BusinessRuleException("Trainer " + trainer.getTrainerCode() + " is inactive");
        }
        return trainer;
    }

    /** A trainer cannot run two planned/running batches with overlapping dates. */
    private void ensureTrainerFree(Trainer trainer, BatchRequest req, BatchStatus status, Long excludeBatchId) {
        if (status != BatchStatus.PLANNED && status != BatchStatus.RUNNING) return;
        long clashes = batchRepository.countOverlappingForTrainer(
                trainer.getTrainerId(), req.startDate(), req.endDate(), excludeBatchId);
        if (clashes > 0) {
            throw new BusinessRuleException("Trainer " + trainer.getFullName()
                    + " already has a batch between " + req.startDate() + " and " + req.endDate());
        }
    }

    private void withdrawActiveEnrolments(Batch batch) {
        enrolmentRepository.search(null, null, batch.getBatchId(), null).stream()
                .filter(e -> e.getStatus() == EnrolmentStatus.ENROLLED || e.getStatus() == EnrolmentStatus.WAITLISTED)
                .forEach(e -> {
                    e.setStatus(EnrolmentStatus.WITHDRAWN);
                    e.setRemarks("Batch cancelled");
                });
    }

    private void applySchedule(Batch batch, BatchRequest req, BatchStatus status) {
        batch.setStartDate(req.startDate());
        batch.setEndDate(req.endDate());
        batch.setMode(req.mode());
        batch.setCapacity(req.capacity());
        batch.setStatus(status);
    }
}
