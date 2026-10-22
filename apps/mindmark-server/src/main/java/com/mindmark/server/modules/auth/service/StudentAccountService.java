package com.mindmark.server.modules.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import cn.dev33.satoken.stp.StpUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.RosterImportTaskEntity;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.dto.ResetPasswordResponse;
import com.mindmark.server.modules.auth.dto.RosterImportErrorResponse;
import com.mindmark.server.modules.auth.dto.RosterImportResponse;
import com.mindmark.server.modules.auth.dto.StudentAccountResponse;
import com.mindmark.server.modules.auth.dto.StudentImportRowRequest;
import com.mindmark.server.modules.auth.dto.StudentRosterImportRequest;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.repository.RosterImportTaskRepository;
import com.mindmark.server.modules.auth.repository.StudentProfileRepository;
import com.mindmark.server.modules.academic.domain.TeachingClassEntity;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentAccountService {

    private static final TypeReference<List<RosterImportErrorResponse>> ERROR_LIST_TYPE = new TypeReference<>() {
    };

    private final AuthContextService authContextService;
    private final AuthUserRepository authUserRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final RosterImportTaskRepository rosterImportTaskRepository;
    private final PasswordHashService passwordHashService;
    private final AuthAuditService authAuditService;
    private final ClassScopeService classScopeService;
    private final ObjectMapper objectMapper;

    public StudentAccountService(
        AuthContextService authContextService,
        AuthUserRepository authUserRepository,
        StudentProfileRepository studentProfileRepository,
        RosterImportTaskRepository rosterImportTaskRepository,
        PasswordHashService passwordHashService,
        AuthAuditService authAuditService,
        ClassScopeService classScopeService,
        ObjectMapper objectMapper
    ) {
        this.authContextService = authContextService;
        this.authUserRepository = authUserRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.rosterImportTaskRepository = rosterImportTaskRepository;
        this.passwordHashService = passwordHashService;
        this.authAuditService = authAuditService;
        this.classScopeService = classScopeService;
        this.objectMapper = objectMapper;
    }

    public byte[] downloadTemplate() {
        String template = "\uFEFFstudentNo,name,email,className,grade,major\r\n"
            + "202601234567,\u5F20\u4E09,zhangsan@example.com,\u8F6F\u4EF6\u5DE5\u7A0B 1 \u73ED,2026,\u8F6F\u4EF6\u5DE5\u7A0B\r\n"
            + "202601234568,\u674E\u56DB,lisi@example.com,\u8F6F\u4EF6\u5DE5\u7A0B 1 \u73ED,2026,\u8F6F\u4EF6\u5DE5\u7A0B\r\n";
        return template.getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public RosterImportResponse importStudents(
        String authorizationHeader,
        String userIdHeader,
        String rolesHeader,
        StudentRosterImportRequest request
    ) {
        AuthUserEntity operator = requireAccountManager(authorizationHeader, userIdHeader, rolesHeader);
        String classId = normalize(request == null ? null : request.classId());
        List<StudentImportRowRequest> rows = request == null || request.students() == null ? List.of() : request.students();
        if (classId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "教学班不能为空");
        }
        if (rows.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "学生名单不能为空");
        }
        classScopeService.requireCanManageClass(classId);
        TeachingClassEntity teachingClass = classScopeService.requireActiveClass(classId);
        String className = teachingClass.getName();

        OffsetDateTime now = OffsetDateTime.now();
        String taskId = "roster-" + UUID.randomUUID();
        List<RosterImportErrorResponse> errors = new ArrayList<>();
        List<StudentAccountResponse> createdStudents = new ArrayList<>();
        Set<String> seenInRequest = new HashSet<>();
        int skippedCount = 0;

        for (int index = 0; index < rows.size(); index += 1) {
            StudentImportRowRequest row = rows.get(index);
            int rowNumber = index + 1;
            String studentNo = normalize(row == null ? null : row.studentNo());
            String name = normalize(row == null ? null : row.name());
            if (studentNo == null || name == null) {
                errors.add(new RosterImportErrorResponse(rowNumber, studentNo, "学号和姓名不能为空"));
                continue;
            }
            if (studentNo.length() < 6) {
                errors.add(new RosterImportErrorResponse(rowNumber, studentNo, "学号至少需要 6 位，才能生成初始密码"));
                continue;
            }
            if (!seenInRequest.add(studentNo)) {
                skippedCount += 1;
                continue;
            }
            if (studentProfileRepository.findByStudentNo(studentNo).isPresent()
                || authUserRepository.existsByUsernameIgnoreCase(studentNo)) {
                skippedCount += 1;
                continue;
            }

            String userId = "u-student-" + UUID.randomUUID();
            String profileId = "student-" + UUID.randomUUID();
            String email = normalize(row.email());
            if (email == null) {
                email = studentNo + "@student.mindmark.local";
            }

            AuthUserEntity user = new AuthUserEntity();
            user.setId(userId);
            user.setName(name);
            user.setEmail(email);
            user.setUsername(studentNo);
            user.setPasswordHash(passwordHashService.hash(initialPassword(studentNo)));
            user.setMustChangePassword(true);
            user.setPasswordUpdatedAt(now);
            user.setLastLoginAt(null);
            user.setAccountSource("ROSTER_IMPORT");
            user.setStatus(UserStatus.ACTIVE);
            user.setStudentId(profileId);
            user.setRoles(new LinkedHashSet<>(Set.of(RoleCode.STUDENT)));
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            authUserRepository.save(user);

            StudentProfileEntity profile = new StudentProfileEntity();
            profile.setId(profileId);
            profile.setUserId(userId);
            profile.setStudentNo(studentNo);
            profile.setClassId(classId);
            profile.setClassName(className);
            profile.setGrade(normalize(row.grade()));
            profile.setMajor(normalize(row.major()));
            profile.setCreatedAt(now);
            profile.setUpdatedAt(now);
            studentProfileRepository.save(profile);

            createdStudents.add(toStudentAccountResponse(profile, user));
        }

        String status = errors.isEmpty() ? "SUCCEEDED" : createdStudents.isEmpty() ? "FAILED" : "PARTIAL_FAILED";
        RosterImportTaskEntity task = new RosterImportTaskEntity();
        task.setId(taskId);
        task.setOperatorId(operator.getId());
        task.setClassId(classId);
        task.setClassName(className);
        task.setStatus(status);
        task.setTotalCount(rows.size());
        task.setCreatedCount(createdStudents.size());
        task.setSkippedCount(skippedCount);
        task.setFailedCount(errors.size());
        task.setErrorReportJson(toJson(errors));
        task.setCreatedAt(now);
        task.setFinishedAt(now);
        rosterImportTaskRepository.save(task);

        authAuditService.record(operator.getId(), "IMPORT_STUDENT_ROSTER", null, status,
            "classId=" + classId + ", total=" + rows.size() + ", created=" + createdStudents.size()
                + ", skipped=" + skippedCount + ", failed=" + errors.size());

        return new RosterImportResponse(
            taskId,
            status,
            rows.size(),
            createdStudents.size(),
            skippedCount,
            errors.size(),
            errors,
            createdStudents
        );
    }

    @Transactional(readOnly = true)
    public RosterImportResponse getImportTask(String authorizationHeader, String userIdHeader, String rolesHeader, String taskId) {
        AuthUserEntity operator = requireAccountManager(authorizationHeader, userIdHeader, rolesHeader);
        RosterImportTaskEntity task = rosterImportTaskRepository.findById(taskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学生名单导入任务不存在"));
        classScopeService.requireCanManageClass(task.getClassId());
        return new RosterImportResponse(
            task.getId(),
            task.getStatus(),
            task.getTotalCount(),
            task.getCreatedCount(),
            task.getSkippedCount(),
            task.getFailedCount(),
            parseErrors(task.getErrorReportJson()),
            List.of()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<StudentAccountResponse> listClassStudents(
        String authorizationHeader,
        String userIdHeader,
        String rolesHeader,
        String classId,
        Integer page,
        Integer pageSize
    ) {
        requireAccountManager(authorizationHeader, userIdHeader, rolesHeader);
        classScopeService.requireCanManageClass(classId);

        PageRequest pageRequest = PageRequest.of(
            PageResponse.normalizePage(page) - 1,
            PageResponse.normalizePageSize(pageSize),
            Sort.by(Sort.Direction.ASC, "studentNo")
        );
        Page<StudentProfileEntity> profilePage = studentProfileRepository.findByClassId(classId, pageRequest);
        if (profilePage.isEmpty() && profilePage.getTotalElements() > 0 && profilePage.getTotalPages() > 0) {
            pageRequest = PageRequest.of(profilePage.getTotalPages() - 1, pageRequest.getPageSize(), pageRequest.getSort());
            profilePage = studentProfileRepository.findByClassId(classId, pageRequest);
        }

        Map<String, AuthUserEntity> usersById = authUserRepository.findAllById(
                profilePage.getContent().stream().map(StudentProfileEntity::getUserId).toList()
            ).stream()
            .collect(Collectors.toMap(AuthUserEntity::getId, Function.identity()));

        return PageResponse.fromPage(profilePage.map(profile -> {
            AuthUserEntity user = usersById.get(profile.getUserId());
            if (user == null) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "学生账号不存在：" + profile.getStudentNo());
            }
            return toStudentAccountResponse(profile, user);
        }));
    }

    @Transactional
    public ResetPasswordResponse resetPassword(
        String authorizationHeader,
        String userIdHeader,
        String rolesHeader,
        String studentId
    ) {
        AuthUserEntity operator = requireAccountManager(authorizationHeader, userIdHeader, rolesHeader);
        StudentProfileEntity profile = studentProfileRepository.findById(studentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学生档案不存在"));
        classScopeService.requireCanManageClass(profile.getClassId());
        AuthUserEntity user = authUserRepository.findById(profile.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学生账号不存在"));
        if (profile.getStudentNo().length() < 6) {
            throw new BusinessException(ErrorCode.CONFLICT, "学生学号不足 6 位，无法重置为默认密码");
        }

        OffsetDateTime now = OffsetDateTime.now();
        user.setPasswordHash(passwordHashService.hash(initialPassword(profile.getStudentNo())));
        user.setMustChangePassword(true);
        user.setPasswordUpdatedAt(now);
        user.setUpdatedAt(now);
        authUserRepository.save(user);
        // A reset password invalidates all existing sessions for that student.
        StpUtil.logout(user.getId());
        authAuditService.record(operator.getId(), "RESET_STUDENT_PASSWORD", user.getId(), "SUCCESS",
            "studentNo=" + profile.getStudentNo() + ", classId=" + profile.getClassId());
        return new ResetPasswordResponse(profile.getId(), user.getUsername(), true);
    }

    private AuthUserEntity requireAccountManager(String authorizationHeader, String userIdHeader, String rolesHeader) {
        AuthUserEntity user = authContextService.getCurrentAuthUser(authorizationHeader, userIdHeader, rolesHeader);
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
        return user;
    }

    private String initialPassword(String studentNo) {
        return studentNo.substring(studentNo.length() - 6);
    }

    private StudentAccountResponse toStudentAccountResponse(StudentProfileEntity profile, AuthUserEntity user) {
        return new StudentAccountResponse(
            profile.getId(),
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getEmail(),
            profile.getStudentNo(),
            profile.getClassId(),
            profile.getClassName(),
            profile.getGrade(),
            profile.getMajor(),
            user.getStatus(),
            user.isMustChangePassword(),
            user.getLastLoginAt(),
            profile.getCreatedAt()
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toJson(List<RosterImportErrorResponse> errors) {
        try {
            return objectMapper.writeValueAsString(errors);
        } catch (JsonProcessingException exception) {
            return "[]";
        }
    }

    private List<RosterImportErrorResponse> parseErrors(String json) {
        try {
            return objectMapper.readValue(json == null || json.isBlank() ? "[]" : json, ERROR_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }
}



