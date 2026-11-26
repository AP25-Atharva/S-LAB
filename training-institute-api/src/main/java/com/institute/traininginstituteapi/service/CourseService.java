package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.CourseRequest;
import com.institute.traininginstituteapi.dto.CourseResponse;
import com.institute.traininginstituteapi.entity.Course;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.DuplicateResourceException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.BatchRepository;
import com.institute.traininginstituteapi.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;

    public CourseService(CourseRepository courseRepository, BatchRepository batchRepository) {
        this.courseRepository = courseRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> findAll(String search, Boolean active) {
        return courseRepository.search(Text.clean(search), active).stream().map(CourseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CourseResponse findById(Long id) {
        return CourseResponse.from(getEntity(id));
    }

    public CourseResponse create(CourseRequest req) {
        String code = Text.code(req.courseCode());
        if (courseRepository.existsByCourseCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("courseCode", "Course code " + code + " already exists");
        }
        Course course = new Course();
        apply(course, req, code);
        return CourseResponse.from(courseRepository.save(course));
    }

    public CourseResponse update(Long id, CourseRequest req) {
        Course course = getEntity(id);
        String code = Text.code(req.courseCode());
        if (courseRepository.existsByCourseCodeIgnoreCaseAndCourseIdNot(code, id)) {
            throw new DuplicateResourceException("courseCode", "Course code " + code + " already exists");
        }
        apply(course, req, code);
        return CourseResponse.from(course);
    }

    /** Soft delete / reactivate. Inactive courses cannot be used for new batches. */
    public CourseResponse setActive(Long id, boolean active) {
        Course course = getEntity(id);
        course.setActive(active);
        return CourseResponse.from(course);
    }

    /** Hard delete is only allowed while no batch refers to the course. */
    public void delete(Long id) {
        Course course = getEntity(id);
        if (batchRepository.existsByCourseCourseId(id)) {
            throw new BusinessRuleException("Course " + course.getCourseCode()
                    + " has batches and cannot be deleted. Deactivate it instead.");
        }
        courseRepository.delete(course);
    }

    Course getEntity(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }

    private void apply(Course course, CourseRequest req, String code) {
        course.setCourseCode(code);
        course.setTitle(Text.clean(req.title()));
        course.setCategory(Text.clean(req.category()));
        course.setDurationHours(req.durationHours());
        course.setFee(req.fee());
        course.setDescription(Text.clean(req.description()));
        if (req.active() != null) course.setActive(req.active());
    }
}
