package com.mindmark.server.modules.question.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.dto.QuestionQuery;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import com.mindmark.server.modules.question.repository.QuestionRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionResponseMapper responseMapper;
    private final ClassScopeService classScopeService;

    public QuestionService(
        QuestionRepository questionRepository,
        QuestionResponseMapper responseMapper,
        ClassScopeService classScopeService
    ) {
        this.questionRepository = questionRepository;
        this.responseMapper = responseMapper;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(String questionId) {
        AuthUserEntity user = classScopeService.requireStaffRole();
        QuestionEntity question = questionRepository.findById(normalizeId(questionId))
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Question not found"));
        requireQuestionCourseScope(user, question.getCourseId());
        return responseMapper.toResponse(question);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionResponse> listQuestions(QuestionQuery query) {
        AuthUserEntity user = classScopeService.requireStaffRole();
        boolean admin = user.getRoles().contains(RoleCode.ADMIN);
        Set<String> visibleCourseIds = admin ? Set.of() : classScopeService.visibleCourseIds();
        if (!admin && visibleCourseIds.isEmpty()) {
            return PageResponse.empty(query.page(), query.pageSize());
        }
        PageRequest pageRequest = PageRequest.of(
            Math.max(query.page(), 1) - 1,
            Math.min(Math.max(query.pageSize(), 1), 100),
            Sort.by(Sort.Direction.DESC, "updatedAt")
        );

        Page<QuestionEntity> page = questionRepository.findAll(
            buildSpecification(query, admin, visibleCourseIds),
            pageRequest
        );

        return PageResponse.fromPage(page.map(responseMapper::toResponse));
    }

    private Specification<QuestionEntity> buildSpecification(
        QuestionQuery query,
        boolean admin,
        Set<String> visibleCourseIds
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();

            if (!admin) {
                predicates.add(root.get("courseId").in(visibleCourseIds));
            }

            if (query.type() != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), query.type()));
            }
            if (query.difficulty() != null) {
                predicates.add(criteriaBuilder.equal(root.get("difficulty"), query.difficulty()));
            }
            if (query.status() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), query.status()));
            }
            if (query.source() != null) {
                predicates.add(criteriaBuilder.equal(root.get("source"), query.source()));
            }
            if (hasText(query.courseId())) {
                predicates.add(criteriaBuilder.equal(root.get("courseId"), query.courseId().trim()));
            }
            if (hasText(query.chapterId())) {
                predicates.add(criteriaBuilder.equal(root.get("chapterId"), query.chapterId().trim()));
            }
            if (query.chapterFromNo() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("chapterNo"), query.chapterFromNo()));
            }
            if (query.chapterToNo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("chapterNo"), query.chapterToNo()));
            }
            if (hasText(query.knowledgePoint())) {
                Join<QuestionEntity, String> knowledgePointJoin = root.join("knowledgePoints", JoinType.LEFT);
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(knowledgePointJoin), contains(query.knowledgePoint())));
                criteriaQuery.distinct(true);
            }
            if (hasText(query.excludePaperId())) {
                Subquery<String> excludedQuestionIds = criteriaQuery.subquery(String.class);
                Root<PaperQuestionEntity> paperQuestionRoot = excludedQuestionIds.from(PaperQuestionEntity.class);
                excludedQuestionIds.select(paperQuestionRoot.get("question").get("id"));
                excludedQuestionIds.where(
                    criteriaBuilder.equal(paperQuestionRoot.get("paper").get("id"), query.excludePaperId().trim())
                );
                predicates.add(criteriaBuilder.not(root.get("id").in(excludedQuestionIds)));
            }
            if (hasText(query.keyword())) {
                String keyword = contains(query.keyword());
                Join<QuestionEntity, String> knowledgePointJoin = root.join("knowledgePoints", JoinType.LEFT);
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("id")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("courseName")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("createdBy")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(knowledgePointJoin), keyword)
                ));
                criteriaQuery.distinct(true);
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void requireQuestionCourseScope(AuthUserEntity user, String courseId) {
        if (!user.getRoles().contains(RoleCode.ADMIN)) {
            classScopeService.requireCanAccessCourse(courseId);
        }
    }

    private String normalizeId(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String contains(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }
}
