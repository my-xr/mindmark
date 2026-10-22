package com.mindmark.server.modules.academic.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.AcademicStatus;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import com.mindmark.server.modules.academic.domain.CourseChapterEntity;
import com.mindmark.server.modules.academic.domain.TeachingClassEntity;
import com.mindmark.server.modules.academic.dto.CourseRequest;
import com.mindmark.server.modules.academic.dto.CourseChapterRequest;
import com.mindmark.server.modules.academic.dto.CourseChapterResponse;
import com.mindmark.server.modules.academic.dto.CourseResponse;
import com.mindmark.server.modules.academic.dto.TeachingClassRequest;
import com.mindmark.server.modules.academic.dto.TeachingClassResponse;
import com.mindmark.server.modules.academic.repository.CourseRepository;
import com.mindmark.server.modules.academic.repository.CourseChapterRepository;
import com.mindmark.server.modules.academic.repository.TeachingClassRepository;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcademicService {

    private final CourseRepository courseRepository;
    private final CourseChapterRepository courseChapterRepository;
    private final TeachingClassRepository teachingClassRepository;
    private final ClassScopeService classScopeService;

    public AcademicService(
        CourseRepository courseRepository,
        CourseChapterRepository courseChapterRepository,
        TeachingClassRepository teachingClassRepository,
        ClassScopeService classScopeService
    ) {
        this.courseRepository = courseRepository;
        this.courseChapterRepository = courseChapterRepository;
        this.teachingClassRepository = teachingClassRepository;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public List<TeachingClassResponse> listVisibleClasses() {
        return classScopeService.visibleClasses().stream().map(this::toTeachingClassResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> listVisibleCourses() {
        if (classScopeService.currentUser().getRoles().contains(RoleCode.ADMIN)) {
            return courseRepository.findByStatusOrderByUpdatedAtDesc(AcademicStatus.ACTIVE).stream()
                .map(this::toCourseResponse)
                .toList();
        }
        LinkedHashMap<String, CourseEntity> courses = new LinkedHashMap<>();
        classScopeService.visibleClasses().stream()
            .map(TeachingClassEntity::getCourse)
            .filter(Objects::nonNull)
            .filter(course -> course.getStatus() == AcademicStatus.ACTIVE)
            .forEach(course -> courses.putIfAbsent(course.getId(), course));
        return courses.values().stream().map(this::toCourseResponse).toList();
    }


    @Transactional(readOnly = true)
    public List<CourseChapterResponse> listVisibleCourseChapters(String courseId) {
        String normalizedCourseId = required(courseId, "courseId");
        classScopeService.requireCanAccessCourse(normalizedCourseId);
        return courseChapterRepository.findByCourse_IdAndStatusOrderByChapterNoAsc(normalizedCourseId, AcademicStatus.ACTIVE)
            .stream()
            .map(this::toCourseChapterResponse)
            .toList();
    }

    @Transactional
    public CourseChapterResponse createCourseChapter(String courseId, CourseChapterRequest request) {
        String normalizedCourseId = required(courseId, "courseId");
        CourseEntity course = courseRepository.findById(normalizedCourseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        Integer chapterNo = request == null ? null : request.chapterNo();
        if (chapterNo == null || chapterNo < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "chapterNo must be greater than or equal to 0");
        }
        if (courseChapterRepository.existsByCourse_IdAndChapterNo(course.getId(), chapterNo)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Course chapter number already exists");
        }
        OffsetDateTime now = OffsetDateTime.now();
        CourseChapterEntity chapter = new CourseChapterEntity();
        chapter.setId("chapter-" + UUID.randomUUID());
        chapter.setCourse(course);
        chapter.setChapterNo(chapterNo);
        chapter.setTitle(required(request.title(), "title"));
        chapter.setDescription(normalize(request.description()));
        chapter.setStatus(request.status() == null ? AcademicStatus.ACTIVE : request.status());
        chapter.setCreatedAt(now);
        chapter.setUpdatedAt(now);
        return toCourseChapterResponse(courseChapterRepository.save(chapter));
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> listAdminCourses() {
        return courseRepository.findAllByOrderByUpdatedAtDesc().stream().map(this::toCourseResponse).toList();
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        String code = required(request == null ? null : request.code(), "code").toUpperCase(Locale.ROOT);
        String name = required(request == null ? null : request.name(), "name");
        if (courseRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Course code already exists");
        }
        OffsetDateTime now = OffsetDateTime.now();
        CourseEntity course = new CourseEntity();
        course.setId("course-" + UUID.randomUUID());
        course.setCode(code);
        course.setName(name);
        course.setDescription(normalize(request.description()));
        course.setStatus(request.status() == null ? AcademicStatus.ACTIVE : request.status());
        course.setCreatedAt(now);
        course.setUpdatedAt(now);
        return toCourseResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse updateCourse(String courseId, CourseRequest request) {
        CourseEntity course = courseRepository.findById(courseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
        String code = required(request == null ? null : request.code(), "code").toUpperCase(Locale.ROOT);
        courseRepository.findByCodeIgnoreCase(code)
            .filter(existing -> !existing.getId().equals(courseId))
            .ifPresent(existing -> { throw new BusinessException(ErrorCode.CONFLICT, "Course code already exists"); });
        course.setCode(code);
        course.setName(required(request.name(), "name"));
        course.setDescription(normalize(request.description()));
        course.setStatus(request.status() == null ? course.getStatus() : request.status());
        course.setUpdatedAt(OffsetDateTime.now());
        return toCourseResponse(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public List<TeachingClassResponse> listAdminClasses() {
        return teachingClassRepository.findAllByOrderByUpdatedAtDesc().stream().map(this::toTeachingClassResponse).toList();
    }

    @Transactional
    public TeachingClassResponse createClass(TeachingClassRequest request) {
        String code = required(request == null ? null : request.code(), "code").toUpperCase(Locale.ROOT);
        String name = required(request == null ? null : request.name(), "name");
        if (teachingClassRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Class code already exists");
        }
        CourseEntity course = resolveCourse(normalize(request.courseId()));
        OffsetDateTime now = OffsetDateTime.now();
        TeachingClassEntity teachingClass = new TeachingClassEntity();
        teachingClass.setId("class-" + UUID.randomUUID());
        teachingClass.setCourse(course);
        teachingClass.setCode(code);
        teachingClass.setName(name);
        teachingClass.setGrade(normalize(request.grade()));
        teachingClass.setMajor(normalize(request.major()));
        teachingClass.setStatus(request.status() == null ? AcademicStatus.ACTIVE : request.status());
        teachingClass.setCreatedAt(now);
        teachingClass.setUpdatedAt(now);
        return toTeachingClassResponse(teachingClassRepository.save(teachingClass));
    }

    @Transactional
    public TeachingClassResponse updateClass(String classId, TeachingClassRequest request) {
        TeachingClassEntity teachingClass = teachingClassRepository.findById(classId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Class not found"));
        String code = required(request == null ? null : request.code(), "code").toUpperCase(Locale.ROOT);
        teachingClassRepository.findByCodeIgnoreCase(code)
            .filter(existing -> !existing.getId().equals(classId))
            .ifPresent(existing -> { throw new BusinessException(ErrorCode.CONFLICT, "Class code already exists"); });
        teachingClass.setCourse(resolveCourse(normalize(request.courseId())));
        teachingClass.setCode(code);
        teachingClass.setName(required(request.name(), "name"));
        teachingClass.setGrade(normalize(request.grade()));
        teachingClass.setMajor(normalize(request.major()));
        teachingClass.setStatus(request.status() == null ? teachingClass.getStatus() : request.status());
        teachingClass.setUpdatedAt(OffsetDateTime.now());
        return toTeachingClassResponse(teachingClassRepository.save(teachingClass));
    }

    private CourseEntity resolveCourse(String courseId) {
        if (courseId == null) {
            return null;
        }
        return courseRepository.findById(courseId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Course not found"));
    }

    private CourseChapterResponse toCourseChapterResponse(CourseChapterEntity chapter) {
        CourseEntity course = chapter.getCourse();
        return new CourseChapterResponse(
            chapter.getId(),
            course == null ? null : course.getId(),
            course == null ? null : course.getName(),
            chapter.getChapterNo(),
            chapter.getTitle(),
            chapter.getDescription(),
            chapter.getStatus(),
            chapter.getCreatedAt(),
            chapter.getUpdatedAt()
        );
    }

    private CourseResponse toCourseResponse(CourseEntity course) {
        return new CourseResponse(course.getId(), course.getCode(), course.getName(), course.getDescription(), course.getStatus(), course.getCreatedAt(), course.getUpdatedAt());
    }

    private TeachingClassResponse toTeachingClassResponse(TeachingClassEntity teachingClass) {
        CourseEntity course = teachingClass.getCourse();
        return new TeachingClassResponse(
            teachingClass.getId(),
            course == null ? null : course.getId(),
            course == null ? null : course.getName(),
            teachingClass.getCode(),
            teachingClass.getName(),
            teachingClass.getGrade(),
            teachingClass.getMajor(),
            teachingClass.getStatus(),
            teachingClass.getCreatedAt(),
            teachingClass.getUpdatedAt()
        );
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, fieldName + " is required");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
