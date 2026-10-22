package com.mindmark.server.modules.auth.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.AcademicStatus;
import com.mindmark.server.modules.academic.domain.TeachingClassEntity;
import com.mindmark.server.modules.academic.repository.TeachingClassRepository;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.repository.StudentProfileRepository;
import com.mindmark.server.modules.auth.repository.TeacherClassAssignmentRepository;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClassScopeService {

    private static final Set<RoleCode> STAFF_ROLES = AuthRolePolicy.STAFF_ROLES;

    private final AuthContextService authContextService;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeachingClassRepository teachingClassRepository;
    private final AuthAuditService authAuditService;

    public ClassScopeService(
        AuthContextService authContextService,
        TeacherClassAssignmentRepository teacherClassAssignmentRepository,
        StudentProfileRepository studentProfileRepository,
        TeachingClassRepository teachingClassRepository,
        AuthAuditService authAuditService
    ) {
        this.authContextService = authContextService;
        this.teacherClassAssignmentRepository = teacherClassAssignmentRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teachingClassRepository = teachingClassRepository;
        this.authAuditService = authAuditService;
    }

    @Transactional(readOnly = true)
    public AuthUserEntity currentUser() {
        AuthUserEntity user = authContextService.getCurrentAuthUser(null, null, null);
        AuthRolePolicy.requireValid(user);
        return user;
    }

    @Transactional(readOnly = true)
    public AuthUserEntity requireStaffRole() {
        AuthUserEntity user = currentUser();
        requireStaffRole(user);
        return user;
    }

    @Transactional(readOnly = true)
    public void requireStaffRole(AuthUserEntity user) {
        AuthRolePolicy.requireValid(user);
        if (user == null || user.getStatus() != UserStatus.ACTIVE
            || user.getRoles() == null || user.getRoles().stream().noneMatch(STAFF_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Teacher, TA or admin role is required");
        }
    }

    @Transactional(readOnly = true)
    public void requireStudentRole() {
        AuthUserEntity user = currentUser();
        if (user.getStatus() != UserStatus.ACTIVE
            || user.getRoles() == null
            || !user.getRoles().contains(RoleCode.STUDENT)
            || user.getRoles().stream().anyMatch(STAFF_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Student role is required");
        }
    }

    @Transactional(readOnly = true)
    public StudentProfileEntity currentStudentProfile() {
        AuthUserEntity user = currentUser();
        requireStudentRole(user);
        return resolveStudentProfile(user);
    }

    /**
     * Student-facing resources must never be reachable by a mixed staff/student
     * identity.  A mixed role set would make it possible to use the student
     * profile as an alternate path around staff-side ownership checks.
     */
    @Transactional(readOnly = true)
    public void requireStudentRole(AuthUserEntity user) {
        AuthRolePolicy.requireValid(user);
        if (user == null
            || user.getStatus() != UserStatus.ACTIVE
            || user.getRoles() == null
            || !user.getRoles().contains(RoleCode.STUDENT)
            || user.getRoles().stream().anyMatch(STAFF_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Student role is required");
        }
    }

    private StudentProfileEntity resolveStudentProfile(AuthUserEntity user) {
        if (user.getStudentId() != null && !user.getStudentId().isBlank()) {
            var profileById = studentProfileRepository.findById(user.getStudentId());
            if (profileById.isPresent()) {
                return profileById.get();
            }
            var profileByStudentIdAsNo = studentProfileRepository.findByStudentNo(user.getStudentId());
            if (profileByStudentIdAsNo.isPresent()) {
                return profileByStudentIdAsNo.get();
            }
        }

        var profileByUserId = studentProfileRepository.findByUserId(user.getId());
        if (profileByUserId.isPresent()) {
            return profileByUserId.get();
        }

        var profileByStudentNo = studentProfileRepository.findByStudentNo(user.getUsername());
        if (profileByStudentNo.isPresent()) {
            return profileByStudentNo.get();
        }

        throw new BusinessException(ErrorCode.NOT_FOUND, "学生档案不存在，请联系教师或管理员检查学生名单导入结果");
    }

    @Transactional(readOnly = true)
    public List<TeachingClassEntity> visibleClasses() {
        AuthUserEntity user = currentUser();
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return teachingClassRepository.findByStatusOrderByUpdatedAtDesc(AcademicStatus.ACTIVE);
        }
        if (user.getRoles().contains(RoleCode.TEACHER) || user.getRoles().contains(RoleCode.TA)) {
            List<String> ids = teacherClassAssignmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(assignment -> assignment.getClassId())
                .distinct()
                .toList();
            if (ids.isEmpty()) {
                return List.of();
            }
            return teachingClassRepository.findByIdInAndStatusOrderByUpdatedAtDesc(ids, AcademicStatus.ACTIVE);
        }
        if (user.getRoles().contains(RoleCode.STUDENT)) {
            StudentProfileEntity profile = currentStudentProfile();
            return teachingClassRepository.findById(profile.getClassId())
                .filter(teachingClass -> teachingClass.getStatus() == AcademicStatus.ACTIVE)
                .map(List::of)
                .orElseGet(List::of);
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public Set<String> visibleClassIds() {
        return visibleClasses().stream()
            .map(TeachingClassEntity::getId)
            .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    @Transactional(readOnly = true)
    public Set<String> visibleCourseIds() {
        AuthUserEntity user = requireStaffRole();
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return Set.of();
        }
        return visibleClasses().stream()
            .map(TeachingClassEntity::getCourse)
            .filter(course -> course != null && course.getId() != null)
            .map(course -> course.getId())
            .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    /**
     * Course scope is the data boundary for question bank and paper resources.
     * An empty visible-course set is reserved for ADMIN and means global scope.
     */
    @Transactional(readOnly = true)
    public void requireCanAccessCourse(String courseId) {
        String normalizedCourseId = normalizeRequired(courseId, "courseId");
        AuthUserEntity user = requireStaffRole();
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return;
        }
        if (!visibleCourseIds().contains(normalizedCourseId)) {
            deny(user.getId(), "COURSE_SCOPE_CHECK", "courseId=" + normalizedCourseId);
        }
    }

    /**
     * Async workers do not have an HTTP request context. They still need the
     * same authorization decision as the submitting teacher.
     */
    @Transactional(readOnly = true)
    public void requireUserCanAccessCourse(String userId, String courseId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        String normalizedCourseId = normalizeRequired(courseId, "courseId");
        AuthUserEntity user = authContextService.findUserById(normalizedUserId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Account session is no longer valid"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Account is disabled");
        }
        requireStaffRole(user);
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return;
        }
        Set<String> courseIds = visibleCourseIdsForUser(user);
        if (!courseIds.contains(normalizedCourseId)) {
            deny(user.getId(), "COURSE_SCOPE_CHECK", "courseId=" + normalizedCourseId);
        }
    }

    @Transactional(readOnly = true)
    public TeachingClassEntity requireActiveClass(String classId) {
        TeachingClassEntity teachingClass = teachingClassRepository.findById(classId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Class not found"));
        if (teachingClass.getStatus() != AcademicStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.CONFLICT, "Class is not active");
        }
        return teachingClass;
    }

    @Transactional(readOnly = true)
    public void requireActiveClasses(List<String> classIds) {
        for (String classId : classIds) {
            requireActiveClass(classId);
        }
    }

    @Transactional(readOnly = true)
    public void requireCanManageClass(String classId) {
        AuthUserEntity user = currentUser();
        requireActiveClass(classId);
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return;
        }
        if ((user.getRoles().contains(RoleCode.TEACHER) || user.getRoles().contains(RoleCode.TA))
            && teacherClassAssignmentRepository.existsByUserIdAndClassId(user.getId(), classId)) {
            return;
        }
        deny(user.getId(), "CLASS_SCOPE_CHECK", "classId=" + classId);
    }

    @Transactional(readOnly = true)
    public void requireCanManageAllClasses(List<String> classIds) {
        AuthUserEntity user = currentUser();
        if (!user.getRoles().contains(RoleCode.ADMIN) && !user.getRoles().contains(RoleCode.TEACHER) && !user.getRoles().contains(RoleCode.TA)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Teacher, TA or admin role is required");
        }
        requireActiveClasses(classIds);
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return;
        }
        for (String classId : classIds) {
            if (!teacherClassAssignmentRepository.existsByUserIdAndClassId(user.getId(), classId)) {
                deny(user.getId(), "CLASS_SCOPE_CHECK", "classId=" + classId);
            }
        }
    }

    /**
     * An exam paper and its target classes must belong to the same course.
     * Role scope alone is not enough: a teacher may legitimately be assigned
     * to several courses, but must not use a paper from course A for a class
     * in course B.
     */
    @Transactional(readOnly = true)
    public void requireClassesBelongToCourse(List<String> classIds, String courseId) {
        String normalizedCourseId = normalizeRequired(courseId, "courseId");
        if (classIds == null || classIds.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "classIds must not be empty");
        }
        for (String classId : classIds) {
            TeachingClassEntity teachingClass = requireActiveClass(classId);
            if (teachingClass.getCourse() == null
                || !normalizedCourseId.equals(teachingClass.getCourse().getId())) {
                throw new BusinessException(
                    ErrorCode.CONFLICT,
                    "考试试卷课程与目标班级课程不一致"
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public void requireCanAccessExam(ExamEntity exam) {
        requireCanManageAllClasses(exam.getClassIds());
    }

    @Transactional(readOnly = true)
    public boolean canAccessAllExamClasses(ExamEntity exam) {
        AuthUserEntity user = currentUser();
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return true;
        }
        if (!user.getRoles().contains(RoleCode.TEACHER) && !user.getRoles().contains(RoleCode.TA)) {
            return false;
        }
        Set<String> visible = visibleClassIds();
        return visible.containsAll(exam.getClassIds());
    }

    @Transactional(readOnly = true)
    public void requireCanPublishScores(ExamEntity exam) {
        AuthUserEntity user = currentUser();
        if (!user.getRoles().contains(RoleCode.ADMIN) && !user.getRoles().contains(RoleCode.TEACHER)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only teacher or admin can publish scores");
        }
        requireActiveClasses(exam.getClassIds());
        if (user.getRoles().contains(RoleCode.ADMIN)) {
            return;
        }
        for (String classId : exam.getClassIds()) {
            if (!teacherClassAssignmentRepository.existsByUserIdAndClassId(user.getId(), classId)) {
                deny(user.getId(), "PUBLISH_SCORE_SCOPE_CHECK", "classId=" + classId);
            }
        }
    }


    @Transactional(readOnly = true)
    public void requireStudentOwnsExam(ExamEntity exam) {
        StudentProfileEntity profile = currentStudentProfile();
        requireActiveClass(profile.getClassId());
        if (exam.getClassIds() == null || !exam.getClassIds().contains(profile.getClassId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot access an exam outside the student's class");
        }
    }
    @Transactional(readOnly = true)
    public void requireStudentOwnsAnswerSheet(AnswerSheetEntity answerSheet) {
        StudentProfileEntity profile = currentStudentProfile();
        if (!profile.getId().equals(answerSheet.getStudentId()) && !profile.getStudentNo().equals(answerSheet.getStudentId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot access another student's answer sheet");
        }
    }

    @Transactional(readOnly = true)
    public boolean currentUserIsStudentOnly() {
        AuthUserEntity user = currentUser();
        return user.getRoles().contains(RoleCode.STUDENT)
            && !user.getRoles().contains(RoleCode.ADMIN)
            && !user.getRoles().contains(RoleCode.TEACHER)
            && !user.getRoles().contains(RoleCode.TA);
    }

    private void deny(String actorId, String action, String detail) {
        authAuditService.record(actorId, action, null, "FAILED", detail);
        throw new BusinessException(ErrorCode.FORBIDDEN, "No permission for this class scope");
    }

    private Set<String> visibleCourseIdsForUser(AuthUserEntity user) {
        List<String> classIds = teacherClassAssignmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
            .map(assignment -> assignment.getClassId())
            .distinct()
            .toList();
        if (classIds.isEmpty()) {
            return Set.of();
        }
        return teachingClassRepository.findByIdInAndStatusOrderByUpdatedAtDesc(classIds, AcademicStatus.ACTIVE).stream()
            .map(TeachingClassEntity::getCourse)
            .filter(course -> course != null && course.getId() != null)
            .map(course -> course.getId())
            .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, fieldName + " is required");
        }
        return value.trim();
    }
}
