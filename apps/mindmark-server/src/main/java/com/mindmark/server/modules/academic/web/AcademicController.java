package com.mindmark.server.modules.academic.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.modules.academic.dto.CourseRequest;
import com.mindmark.server.modules.academic.dto.CourseChapterRequest;
import com.mindmark.server.modules.academic.dto.CourseChapterResponse;
import com.mindmark.server.modules.academic.dto.CourseResponse;
import com.mindmark.server.modules.academic.dto.TeachingClassRequest;
import com.mindmark.server.modules.academic.dto.TeachingClassResponse;
import com.mindmark.server.modules.academic.service.AcademicService;
import com.mindmark.server.modules.auth.domain.RoleCode;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AcademicController {

    private final AcademicService academicService;

    public AcademicController(AcademicService academicService) {
        this.academicService = academicService;
    }

    @GetMapping("/api/v1/classes")
    public ApiResponse<List<TeachingClassResponse>> listVisibleClasses() {
        return ApiResponse.success(academicService.listVisibleClasses());
    }

    @GetMapping("/api/v1/courses")
    public ApiResponse<List<CourseResponse>> listVisibleCourses() {
        return ApiResponse.success(academicService.listVisibleCourses());
    }

    @GetMapping("/api/v1/courses/{courseId}/chapters")
    public ApiResponse<List<CourseChapterResponse>> listVisibleCourseChapters(@PathVariable String courseId) {
        return ApiResponse.success(academicService.listVisibleCourseChapters(courseId));
    }

    @PostMapping("/api/v1/admin/courses/{courseId}/chapters")
    public ApiResponse<CourseChapterResponse> createCourseChapter(
        @PathVariable String courseId,
        @Valid @RequestBody CourseChapterRequest request
    ) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.createCourseChapter(courseId, request));
    }

    @GetMapping("/api/v1/admin/courses")
    public ApiResponse<List<CourseResponse>> listAdminCourses() {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.listAdminCourses());
    }

    @PostMapping("/api/v1/admin/courses")
    public ApiResponse<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.createCourse(request));
    }

    @PatchMapping("/api/v1/admin/courses/{courseId}")
    public ApiResponse<CourseResponse> updateCourse(@PathVariable String courseId, @Valid @RequestBody CourseRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.updateCourse(courseId, request));
    }

    @GetMapping("/api/v1/admin/classes")
    public ApiResponse<List<TeachingClassResponse>> listAdminClasses() {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.listAdminClasses());
    }

    @PostMapping("/api/v1/admin/classes")
    public ApiResponse<TeachingClassResponse> createClass(@Valid @RequestBody TeachingClassRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.createClass(request));
    }

    @PatchMapping("/api/v1/admin/classes/{classId}")
    public ApiResponse<TeachingClassResponse> updateClass(@PathVariable String classId, @Valid @RequestBody TeachingClassRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(academicService.updateClass(classId, request));
    }
}
