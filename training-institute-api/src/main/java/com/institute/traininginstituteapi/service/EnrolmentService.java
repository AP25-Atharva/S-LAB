package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.EnrolmentRequest;
import com.institute.traininginstituteapi.dto.EnrolmentResponse;
import com.institute.traininginstituteapi.dto.SeatCounts;
import com.institute.traininginstituteapi.entity.*;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.BatchRepository;
import com.institute.traininginstituteapi.repository.EnrolmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class EnrolmentService {

    /** Statuses that take a seat in the batch. */
    private static final Set<EnrolmentStatus> SEAT_TAKING = Set.of(EnrolmentStatus.ENROLLED, EnrolmentStatus.COMPLETED);
    /** Statuses that count as a "live" enrolment for the duplicate check. */
    private static final Set<EnrolmentStatus> LIVE = Set.of(EnrolmentStatus.ENROLLED, EnrolmentStatus.WAITLISTED);

    private final EnrolmentRepository enrolmentRepository;
    private final BatchRepository batchRepository;
    private final StudentService studentService;
    private final SeatCalculator seatCalculator;

    public EnrolmentService(EnrolmentRepository enrolmentRepository, BatchRepository batchRepository,
                            StudentService studentService, SeatCalculator seatCalculator) {
        this.enrolmentRepository = enrolmentRepository;
        this.batchRepository = batchRepository;
        this.studentService = studentService;
        this.seatCalculator = seatCalculator;
    }

    @Transactional(readOnly = true)
    public List<EnrolmentResponse> findAll(String search, EnrolmentStatus status, Long batchId, Long studentId) {
        return enrolmentRepository.search(Text.clean(search), status, batchId, studentId).stream()
                .map(EnrolmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public EnrolmentResponse findById(Long id) {
        return EnrolmentResponse.from(getEntity(id));
    }

    public EnrolmentResponse create(EnrolmentRequest req) {
        EnrolmentStatus status = req.status() == null ? EnrolmentStatus.ENROLLED : req.status();
        if (!LIVE.contains(status)) {
            throw new BusinessRuleException("A new enrolment must be ENROLLED or WAITLISTED");
        }
        Student student = activeStudent(req.studentId());
        Batch batch = openBatchLocked(req.batchId());

        if (enrolmentRepository.existsActive(student.getStudentId(), batch.getBatchId(), null)) {
            throw new BusinessRuleException("Student " + student.getStudentCode()
                    + " is already enrolled or waitlisted in batch " + batch.getBatchCode());
        }
        if (status == EnrolmentStatus.ENROLLED) {
            ensureSeatAvailable(batch);
        }

        Enrolment e = new Enrolment();
        e.setStudent(student);
        e.setBatch(batch);
        e.setEnrolmentDate(LocalDateTime.now());
        e.setStatus(status);
        e.setAttendancePercentage(req.attendancePercentage() == null ? BigDecimal.ZERO : req.attendancePercentage());
        e.setRemarks(Text.clean(req.remarks()));
        return EnrolmentResponse.from(enrolmentRepository.save(e));
    }

    /** Update status / attendance / remarks; changing student or batch acts as a transfer and is re-validated. */
    public EnrolmentResponse update(Long id, EnrolmentRequest req) {
        Enrolment e = getEntity(id);
        EnrolmentStatus newStatus = req.status() == null ? e.getStatus() : req.status();
        boolean studentChanged = !Objects.equals(e.getStudent().getStudentId(), req.studentId());
        boolean batchChanged = !Objects.equals(e.getBatch().getBatchId(), req.batchId());

        Student student = studentChanged ? activeStudent(req.studentId()) : e.getStudent();
        Batch batch = batchChanged ? openBatchLocked(req.batchId()) : lockBatch(e.getBatch().getBatchId());

        applyStatusRules(e, student, batch, newStatus, batchChanged);

        e.setStudent(student);
        e.setBatch(batch);
        e.setStatus(newStatus);
        if (req.attendancePercentage() != null) e.setAttendancePercentage(req.attendancePercentage());
        e.setRemarks(Text.clean(req.remarks()));
        return EnrolmentResponse.from(e);
    }

    /** PATCH status, e.g. WITHDRAWN (frees the seat) or COMPLETED. */
    public EnrolmentResponse changeStatus(Long id, EnrolmentStatus status) {
        Enrolment e = getEntity(id);
        Batch batch = lockBatch(e.getBatch().getBatchId());
        applyStatusRules(e, e.getStudent(), batch, status, false);
        e.setStatus(status);
        return EnrolmentResponse.from(e);
    }

    /** Only withdrawn or waitlisted records may be removed; active ones must be withdrawn first. */
    public void delete(Long id) {
        Enrolment e = getEntity(id);
        if (e.getStatus() == EnrolmentStatus.ENROLLED || e.getStatus() == EnrolmentStatus.COMPLETED) {
            throw new BusinessRuleException("An " + e.getStatus()
                    + " enrolment cannot be deleted. Withdraw it instead.");
        }
        enrolmentRepository.delete(e);
    }

    Enrolment getEntity(Long id) {
        return enrolmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Enrolment", id));
    }

    private void applyStatusRules(Enrolment e, Student student, Batch batch, EnrolmentStatus newStatus,
                                  boolean batchChanged) {
        if (LIVE.contains(newStatus)) {
            if (e.getStatus() == EnrolmentStatus.WITHDRAWN || e.getStatus() == EnrolmentStatus.COMPLETED || batchChanged) {
                ensureBatchOpen(batch);
            }
            if (enrolmentRepository.existsActive(student.getStudentId(), batch.getBatchId(), e.getEnrolmentId())) {
                throw new BusinessRuleException("Student " + student.getStudentCode()
                        + " is already enrolled or waitlisted in batch " + batch.getBatchCode());
            }
        }
        boolean alreadyHoldsSeat = !batchChanged && SEAT_TAKING.contains(e.getStatus());
        if (SEAT_TAKING.contains(newStatus) && !alreadyHoldsSeat) {
            ensureSeatAvailable(batch);
        }
    }

    private void ensureSeatAvailable(Batch batch) {
        SeatCounts seats = seatCalculator.forBatch(batch);
        if (seats.full()) {
            throw new BusinessRuleException("Batch " + batch.getBatchCode() + " is full ("
                    + seats.occupied() + "/" + batch.getCapacity() + " seats taken). Enrol the student as WAITLISTED instead.");
        }
    }

    private Student activeStudent(Long studentId) {
        Student student = studentService.getEntity(studentId);
        if (student.getStatus() != StudentStatus.ACTIVE) {
            throw new BusinessRuleException("Student " + student.getStudentCode() + " is inactive");
        }
        return student;
    }

    private Batch lockBatch(Long batchId) {
        return batchRepository.findByIdForUpdate(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch", batchId));
    }

    private Batch openBatchLocked(Long batchId) {
        Batch batch = lockBatch(batchId);
        ensureBatchOpen(batch);
        return batch;
    }

    private void ensureBatchOpen(Batch batch) {
        if (batch.getStatus() != BatchStatus.PLANNED && batch.getStatus() != BatchStatus.RUNNING) {
            throw new BusinessRuleException("Batch " + batch.getBatchCode() + " is " + batch.getStatus()
                    + " and is not accepting enrolments");
        }
    }
}
