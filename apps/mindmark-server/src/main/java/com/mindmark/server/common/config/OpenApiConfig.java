package com.mindmark.server.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mindmarkOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("MindMark API")
                .version("v1")
                .description("MindMark exam loop backend API contract. Static contract source: apps/mindmark-server/openapi/mindmark-api.yaml.")
                .license(new License().name("Internal Use")));
    }
}
