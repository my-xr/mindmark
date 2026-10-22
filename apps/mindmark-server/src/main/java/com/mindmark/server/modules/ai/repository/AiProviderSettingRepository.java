package com.mindmark.server.modules.ai.repository;

import com.mindmark.server.modules.ai.domain.AiProviderSettingEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiProviderSettingRepository extends JpaRepository<AiProviderSettingEntity, String> {
    Optional<AiProviderSettingEntity> findByTeacherIdAndProvider(String teacherId, String provider);
}
