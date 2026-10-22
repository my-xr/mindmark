package com.mindmark.server.modules.auth.repository;

import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfileEntity, String> {

    Optional<StudentProfileEntity> findByStudentNo(String studentNo);

    Optional<StudentProfileEntity> findByUserId(String userId);

    List<StudentProfileEntity> findByClassIdOrderByStudentNoAsc(String classId);

    Page<StudentProfileEntity> findByClassId(String classId, Pageable pageable);
}