package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.DashboardResponse;
import com.institute.traininginstituteapi.entity.BatchStatus;
import com.institute.traininginstituteapi.entity.EnrolmentStatus;
import com.institute.traininginstituteapi.entity.StudentStatus;
import com.institute.traininginstituteapi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int UPCOMING_DAYS = 30;

    private final CourseRepository courseRepository;
    private final TrainerRepository trainerRepository;
    private final StudentRepository studentRepository;
    private final BatchRepository batchRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final BatchService batchService;

    public DashboardService(CourseRepository courseRepository, TrainerRepository trainerRepository,
                            StudentRepository studentRepository, BatchRepository batchRepository,
                            EnrolmentRepository enrolmentRepository, BatchService batchService) {
        this.courseRepository = courseRepository;
        this.trainerRepository = trainerRepository;
        this.studentRepository = studentRepository;
        this.batchRepository = batchRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.batchService = batchService;
    }

    public DashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        return new DashboardResponse(
                courseRepository.count(),
                courseRepository.countByActiveTrue(),
                trainerRepository.countByActiveTrue(),
                studentRepository.countByStatus(StudentStatus.ACTIVE),
                batchRepository.countByStatus(BatchStatus.PLANNED),
                batchRepository.countByStatus(BatchStatus.RUNNING),
                batchRepository.countByStatus(BatchStatus.COMPLETED),
                batchRepository.countByStatus(BatchStatus.CANCELLED),
                enrolmentRepository.countByStatus(EnrolmentStatus.ENROLLED),
                enrolmentRepository.countByStatus(EnrolmentStatus.WAITLISTED),
                enrolmentRepository.countByStatus(EnrolmentStatus.COMPLETED),
                enrolmentRepository.countByStatus(EnrolmentStatus.WITHDRAWN),
                batchService.toResponses(batchRepository.search(null, BatchStatus.RUNNING, null, null)),
                batchService.toResponses(batchRepository.findUpcoming(today, today.plusDays(UPCOMING_DAYS))),
                batchService.toResponses(batchRepository.findDelayed(today)));
    }
}
