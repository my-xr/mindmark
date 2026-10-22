package com.mindmark.server.system;

import com.mindmark.server.common.api.ApiResponse;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<HealthStatus> health() {
        return ApiResponse.success(new HealthStatus("UP", "mindmark-server", OffsetDateTime.now()));
    }

    public record HealthStatus(String status, String service, OffsetDateTime checkedAt) {
    }
}
