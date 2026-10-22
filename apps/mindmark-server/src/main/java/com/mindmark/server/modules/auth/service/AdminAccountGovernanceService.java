package com.mindmark.server.modules.auth.service;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthAuditLogEntity;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.TeacherClassAssignmentEntity;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.dto.AdminUserResponse;
import com.mindmark.server.modules.auth.dto.AuthAuditLogResponse;
import com.mindmark.server.modules.auth.dto.ClassAssignmentRequest;
import com.mindmark.server.modules.auth.dto.ClassAssignmentResponse;
import com.mindmark.server.modules.auth.dto.UpdateUserRolesRequest;
import com.mindmark.server.modules.auth.dto.UpdateUserStatusRequest;
import com.mindmark.server.modules.auth.repository.AuthAuditLogRepository;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.repository.TeacherClassAssignmentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAccountGovernanceService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ASSIGNMENT_ROLES = Set.of("OWNER", "ASSISTANT");

    private final AuthUserRepository authUserRepository;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final AuthAuditLogRepository authAuditLogRepository;
    private final AuthAuditService authAuditService;
    private final ClassScopeService classScopeService;

    public AdminAccountGovernanceService(
        AuthUserRepository authUserRepository,
        TeacherClassAssignmentRepository teacherClassAssignmentRepository,
        AuthAuditLogRepository authAuditLogRepository,
        AuthAuditService authAuditService,
        ClassScopeService classScopeService
    ) {
        this.authUserRepository = authUserRepository;
        this.teacherClassAssignmentRepository = teacherClassAssignmentRepository;
        this.authAuditLogRepository = authAuditLogRepository;
        this.authAuditService = authAuditService;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> listUsers(String keyword, RoleCode role, UserStatus status, int page, int pageSize) {
        Pageable pageable = PageRequest.of(normalizePage(page), normalizePageSize(pageSize), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuthUserEntity> result = authUserRepository.findAll(userSpecification(keyword, role, status), pageable);
        return new PageResponse<>(result.getContent().stream().map(this::toAdminUserResponse).toList(), result.getTotalElements(), page, pageable.getPageSize());
    }

    @Transactional
    public AdminUserResponse updateStatus(String userId, UpdateUserStatusRequest request) {
        UserStatus status = request == null ? null : request.status();
        if (status == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "status is required");
        }
        AuthUserEntity user = findUser(userId);
        String actorId = currentActorId();
        if (user.getId().equals(actorId) && status == UserStatus.DISABLED) {
            throw new BusinessException(ErrorCode.CONFLICT, "Current admin cannot disable own account");
        }

        UserStatus before = user.getStatus();
        user.setStatus(status);
        if (status == UserStatus.ACTIVE) {
            user.setLockedUntil(null);
            user.setFailedLoginCount(0);
        }
        user.setUpdatedAt(OffsetDateTime.now());
        AuthUserEntity saved = authUserRepository.save(user);
        if (status == UserStatus.DISABLED) {
            StpUtil.logout(userId);
        }
        authAuditService.record(actorId, "ADMIN_UPDATE_USER_STATUS", userId, "SUCCESS", "status " + before + " -> " + status);
        return toAdminUserResponse(saved);
    }

    @Transactional
    public AdminUserResponse updateRoles(String userId, UpdateUserRolesRequest request) {
        Set<RoleCode> roles = request == null ? null : request.roles();
        if (roles == null || roles.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "roles must not be empty");
        }
        if (roles.contains(RoleCode.STUDENT)
            && roles.stream().anyMatch(role -> role != RoleCode.STUDENT)) {
            throw new BusinessException(
                ErrorCode.VALIDATION_ERROR,
                "STUDENT role cannot be combined with administrator, teacher or TA roles"
            );
        }
        if (roles.contains(RoleCode.ADMIN) && roles.size() > 1) {
            throw new BusinessException(
                ErrorCode.VALIDATION_ERROR,
                "ADMIN role must be assigned as a standalone role"
            );
        }
        AuthUserEntity user = findUser(userId);
        String actorId = currentActorId();
        if (user.getId().equals(actorId) && !roles.contains(RoleCode.ADMIN)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Current admin cannot remove own ADMIN role");
        }
        Set<RoleCode> normalizedRoles = new LinkedHashSet<>(roles);
        Set<RoleCode> before = new LinkedHashSet<>(user.getRoles());
        user.setRoles(normalizedRoles);
        user.setUpdatedAt(OffsetDateTime.now());
        AuthUserEntity saved = authUserRepository.save(user);
        // Sa-Token may cache role data for an existing token. Revoke every
        // session so privilege changes take effect immediately.
        StpUtil.logout(userId);
        authAuditService.record(actorId, "ADMIN_UPDATE_USER_ROLES", userId, "SUCCESS", "roles " + before + " -> " + normalizedRoles);
        return toAdminUserResponse(saved);
    }

    @Transactional
    public AdminUserResponse unlockUser(String userId) {
        AuthUserEntity user = findUser(userId);
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        user.setUpdatedAt(OffsetDateTime.now());
        AuthUserEntity saved = authUserRepository.save(user);
        authAuditService.record(currentActorId(), "ADMIN_UNLOCK_USER", userId, "SUCCESS", "failed login counter cleared");
        return toAdminUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClassAssignmentResponse> listClassAssignments(String userId) {
        findUser(userId);
        return teacherClassAssignmentRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toClassAssignmentResponse)
            .toList();
    }

    @Transactional
    public ClassAssignmentResponse upsertClassAssignment(String userId, ClassAssignmentRequest request) {
        AuthUserEntity user = findUser(userId);
        if (!user.getRoles().contains(RoleCode.TEACHER) && !user.getRoles().contains(RoleCode.TA)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Only teacher or TA accounts can be assigned to classes");
        }
        String classId = normalize(request == null ? null : request.classId());
        String assignmentRole = normalize(request == null ? null : request.assignmentRole());
        if (classId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "classId is required");
        }
        classScopeService.requireActiveClass(classId);
        assignmentRole = assignmentRole == null ? "ASSISTANT" : assignmentRole.toUpperCase(Locale.ROOT);
        if (!ASSIGNMENT_ROLES.contains(assignmentRole)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "assignmentRole must be OWNER or ASSISTANT");
        }

        OffsetDateTime now = OffsetDateTime.now();
        String finalAssignmentRole = assignmentRole;
        TeacherClassAssignmentEntity assignment = teacherClassAssignmentRepository.findByUserIdAndClassId(userId, classId)
            .orElseGet(() -> {
                TeacherClassAssignmentEntity created = new TeacherClassAssignmentEntity();
                created.setId("tca-" + UUID.randomUUID());
                created.setUserId(userId);
                created.setClassId(classId);
                created.setCreatedAt(now);
                return created;
            });
        String before = assignment.getAssignmentRole();
        assignment.setAssignmentRole(finalAssignmentRole);
        TeacherClassAssignmentEntity saved = teacherClassAssignmentRepository.save(assignment);
        authAuditService.record(currentActorId(), "ADMIN_UPSERT_CLASS_ASSIGNMENT", userId, "SUCCESS", "classId=" + classId + ", role " + before + " -> " + finalAssignmentRole);
        return toClassAssignmentResponse(saved);
    }

    @Transactional
    public void deleteClassAssignment(String userId, String assignmentId) {
        findUser(userId);
        TeacherClassAssignmentEntity assignment = teacherClassAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Class assignment not found"));
        if (!assignment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Class assignment not found");
        }
        teacherClassAssignmentRepository.delete(assignment);
        authAuditService.record(currentActorId(), "ADMIN_DELETE_CLASS_ASSIGNMENT", userId, "SUCCESS", "classId=" + assignment.getClassId());
    }

    @Transactional(readOnly = true)
    public PageResponse<AuthAuditLogResponse> listAuditLogs(
        String actorId,
        String targetUserId,
        String action,
        String result,
        int page,
        int pageSize
    ) {
        Pageable pageable = PageRequest.of(normalizePage(page), normalizePageSize(pageSize), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuthAuditLogEntity> logs = authAuditLogRepository.findAll(auditLogSpecification(actorId, targetUserId, action, result), pageable);
        return new PageResponse<>(logs.getContent().stream().map(this::toAuthAuditLogResponse).toList(), logs.getTotalElements(), page, pageable.getPageSize());
    }

    private Specification<AuthUserEntity> userSpecification(String keyword, RoleCode role, UserStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String normalizedKeyword = normalize(keyword);
            if (normalizedKeyword != null) {
                String pattern = "%" + normalizedKeyword.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("username")), pattern),
                    cb.like(cb.lower(root.get("id")), pattern)
                ));
            }
            if (role != null) {
                if (query != null) {
                    query.distinct(true);
                }
                Join<AuthUserEntity, RoleCode> roleJoin = root.join("roles");
                predicates.add(cb.equal(roleJoin, role));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<AuthAuditLogEntity> auditLogSpecification(String actorId, String targetUserId, String action, String result) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String normalizedActorId = normalize(actorId);
            if (normalizedActorId != null) {
                predicates.add(cb.equal(root.get("actorId"), normalizedActorId));
            }
            String normalizedTargetUserId = normalize(targetUserId);
            if (normalizedTargetUserId != null) {
                predicates.add(cb.equal(root.get("targetUserId"), normalizedTargetUserId));
            }
            String normalizedAction = normalize(action);
            if (normalizedAction != null) {
                predicates.add(cb.like(cb.lower(root.get("action")), "%" + normalizedAction.toLowerCase(Locale.ROOT) + "%"));
            }
            String normalizedResult = normalize(result);
            if (normalizedResult != null) {
                predicates.add(cb.equal(cb.lower(root.get("result")), normalizedResult.toLowerCase(Locale.ROOT)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private AuthUserEntity findUser(String userId) {
        return authUserRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "User not found"));
    }

    private AdminUserResponse toAdminUserResponse(AuthUserEntity user) {
        List<RoleCode> roles = user.getRoles().stream()
            .sorted(Comparator.comparing(Enum::name))
            .toList();
        return new AdminUserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getUsername(),
            roles,
            user.getStatus(),
            user.isMustChangePassword(),
            user.getFailedLoginCount(),
            user.getLockedUntil(),
            user.getAccountSource(),
            user.getStudentId(),
            user.getLastLoginAt(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    private ClassAssignmentResponse toClassAssignmentResponse(TeacherClassAssignmentEntity assignment) {
        return new ClassAssignmentResponse(
            assignment.getId(),
            assignment.getUserId(),
            assignment.getClassId(),
            assignment.getAssignmentRole(),
            assignment.getCreatedAt()
        );
    }

    private AuthAuditLogResponse toAuthAuditLogResponse(AuthAuditLogEntity log) {
        return new AuthAuditLogResponse(log.getId(), log.getActorId(), log.getAction(), log.getTargetUserId(), log.getResult(), log.getDetail(), log.getCreatedAt());
    }

    private String currentActorId() {
        return StpUtil.getLoginIdAsString();
    }

    private int normalizePage(int page) {
        return Math.max(0, page - 1);
    }

    private int normalizePageSize(int pageSize) {
        if (pageSize <= 0) {
            return 20;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}


