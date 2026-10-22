# mindmark-server

MindMark backend main service under `apps/mindmark-server`. It uses Spring Boot as a modular monolith for the exam closed loop.

## Local prerequisites

- JDK 21
- Maven 3.9+
- PostgreSQL: `localhost:5432`, database `mindmark`, username `postgres`, password `123456`
- Redis: `localhost:6379`, no password
- MinIO: bucket `mindmark-artifacts` when export/download features are enabled

The local defaults are intentionally aligned with `src/main/resources/application.yml`:

- PostgreSQL: `localhost:5432/mindmark`, `postgres/123456`
- Redis: `localhost:6379`, no password
- MinIO: `http://localhost:9000`, `minioadmin/minioadmin123`

Copy the variable names from `.env.example` into the shell or IDE when a port or credential differs. The template is documentation only; Spring Boot does not load `.env` files automatically.

> Do not commit secrets. AI question generation supports OpenAI / Anthropic. API keys must be injected through teacher personal settings or runtime environment variables (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`). `KIMI_API_KEY` is retained only for legacy lecture-draft compatibility.

## Commands

```bash
mvn -f apps/mindmark-server/pom.xml test
mvn -f apps/mindmark-server/pom.xml spring-boot:run
```

For the production profile, inject every required value and start with:

```powershell
$env:SPRING_PROFILES_ACTIVE = "prod"
mvn -f apps/mindmark-server/pom.xml spring-boot:run
```

Production rejects local database, MinIO and AI encryption defaults. OpenAPI and Swagger remain disabled unless explicitly enabled by a separate non-production profile.

Health check:

```text
GET http://localhost:8080/api/v1/system/health
```

OpenAPI:

- Static contract: `apps/mindmark-server/openapi/mindmark-api.yaml`
- Runtime Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Data access

- ORM / Repository: Spring Data JPA
- ORM implementation: Hibernate
- Connection pool: HikariCP
- Migration: Flyway

Hibernate DDL auto is set to `none`; schema changes must be added through Flyway migration files.
