package com.mindmark.server.modules.auth.repository;

import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuthUserRepository extends JpaRepository<AuthUserEntity, String>, JpaSpecificationExecutor<AuthUserEntity> {

    Optional<AuthUserEntity> findByEmailIgnoreCase(String email);

    Optional<AuthUserEntity> findByUsernameIgnoreCase(String username);

    Optional<AuthUserEntity> findFirstByNameIgnoreCase(String name);

    boolean existsByUsernameIgnoreCase(String username);
}
