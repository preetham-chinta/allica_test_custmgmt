# Technical Implementation Deep-Dive

This document provides a comprehensive specification of the Test implementation. It covers the architectural decisions, design patterns, and engineering standards implemented across the full stack.

---

## 1. Backend Comparison: Spring MVC vs Spring WebFlux

| Feature         | Spring MVC (Port 8080)               | Spring WebFlux (Port 8081)                        |
| --------------- | ------------------------------------ | ------------------------------------------------- |
| **Runtime**     | Tomcat (Blocking)                    | Netty (Non-blocking)                              |
| **Model**       | One thread per request               | Event-Loop (Reactive)                             |
| **Database**    | JPA / Hibernate (Sync)               | R2DBC (Async/Reactive)                            |
| **Routing**     | Annotation-based (`@RestController`) | Functional (`RouterFunction` + `HandlerFunction`) |
| **Testing**     | `MockMvc` + `@WebMvcTest`            | `WebTestClient` + `StepVerifier`                  |
| **Programming** | Imperative                           | Reactive (`Mono<T>` / `Flux<T>`)                  |

### Detailed API Endpoints

Both backends expose identical endpoints. The frontend uses a header toggle to switch between them at runtime.

| Method | Path                        | Version | Description                                           |
| ------ | --------------------------- | ------- | ----------------------------------------------------- |
| POST   | `/api/v1/customers`         | v1      | Create customer                                       |
| GET    | `/api/v1/customers`         | v1      | List all customers (Frozen contract)                  |
| GET    | `/api/v1/customers/{id}`    | v1      | Get by ID                                             |
| GET    | `/api/v2/customers`         | v2      | Extended response: adds `fullName`, `email`, `status` |
| GET    | `/api/v2/customers/search`  | v2      | Full-text prefix/fuzzy search (Lucene)                |
| POST   | `/api/v2/customers/search`  | v2      | Advanced search — fuzzy, date range                   |
| GET    | `/api/v2/customers/suggest` | v2      | Typeahead suggestions                                 |

---

## 2. API Versioning & Evolution

The system supports three distinct API versioning strategies through a single filter layer, showcasing three best practices.

### Versioning Strategies

- **URI Path**: `/api/v1/customers` (Default, most explicit)
- **Custom Header**: `X-API-Version: v2`
- **Accept Header**: `Accept: application/vnd.allicatest.v2+json`

### V1 vs V2 Evolution

- **V1 (Frozen)**: Stable contract including `id`, `firstName`, `lastName`, and `dateOfBirth`.
- **V2 (Additive)**: Extends the model with `fullName`, `email`, `status`, and `updatedAt`.
- **Backward Compatibility**: Schema changes are additive only (Flyway V2 migration), ensuring existing V1 consumers are never broken by new deployments.

---

## 3. Layered Error Strategy (UI)

This solution ensures that transport details (HTTP codes) never leak into the UI layer. This is achieved through a multi-layered mapping strategy. Providing a good user experience. Seggregated well and structured for easy modification in future

### The Error Flow:

1.  **HttpClient**: Intercepts HTTP 4xx/5xx responses and maps them to a generic `AppError` using an `HttpErrorMap`.
2.  **CustomerService**: Receives the `AppError` and maps it to a specific **Domain Error** (e.g., `DuplicateCustomerError`).
3.  **Component Layer**: Catches domain errors by type (`instanceof`) and displays a user-friendly `error.userMessage`.

### Key Benefits:

- **Separation of Concerns**: The UI knows about "Duplicate Customers," not "HTTP 409."
- **Logging**: The `AppError` carries a `serverMessage` (for developers) while the Domain Error carries a `userMessage` (safe for end-users).
- **Recoverability**: Generic error boundaries isolate failures (e.g., a crash in the list doesn't kill the "Add Customer" form).

---

## 4. Security & OWASP Coverage

Security is treated as a first-class citizen with a "Defense-in-Depth" strategy.

### Authentication

- **JWT RS256**: Asymmetric signing (as opposed to HS256) ensures the resource server only needs a public key for verification.
- **Method-Level Security**: `@PreAuthorize` on every service method provides a second layer of defense behind URL-level rules.

### OWASP A05 Mitigation Table

| Header                    | Value                             | Mitigates                                    |
| ------------------------- | --------------------------------- | -------------------------------------------- |
| `X-Content-Type-Options`  | `nosniff`                         | MIME sniffing attacks                        |
| `X-Frame-Options`         | `DENY`                            | Clickjacking                                 |
| `X-XSS-Protection`        | `0`                               | Disables broken IE auditor (replaced by CSP) |
| `Referrer-Policy`         | `strict-origin-when-cross-origin` | Path leakage to third parties                |
| `Permissions-Policy`      | `geolocation=(), camera=()...`    | Disables unused browser APIs                 |
| `Content-Security-Policy` | `default-src 'none'`              | XSS and data injection attacks               |

### BFF Pattern

While this demo uses a simplified auth flow, it is documented for **Next.js API routes + NextAuth.js** as the Production BFF. This ensures the JWT is never stored in the browser (JS-accessible), instead using an `HttpOnly` session cookie to mitigate XSS-based token theft (RFC 9700).

---

## 5. Frontend Architecture & Patterns

The React 18 application is designed for modularity and professional state management.

### Component Wrapper Pattern

- **Rule**: `@mui/material` is only imported inside `src/components/ui/`.
- All other components import from our local UI primitives. This absolute decoupling allows for swapping the entire UI library (e.g., to Tailwind or Ant Design) by modifying just 6 files instead of 60.

### Advanced Patterns

- **React 18 `useDeferredValue`**: Used for non-blocking search. The input remains responsive at 60fps while results load in a lower-priority background render.
- **TanStack Query v5**: Handles infinite scrolling, optimistic updates, and smart cache invalidation.
- **IntersectionObserver**: Powers infinite scroll without the performance overhead of scroll event listeners.

---

## 6. Engineering Standards & Pipeline

### Build Lifecycle (Gradle vs Maven)

The build uses a multi-module Gradle structure with shared configurations at the root level.

| Stage               | Maven Equivalent | Gradle Tool                 | Goal                                          |
| ------------------- | ---------------- | --------------------------- | --------------------------------------------- |
| **Formatting**      | Spotless         | `com.diffplug.spotless`     | Auto-formatting with Palantir style.          |
| **Static Analysis** | Checkstyle       | `checkstyle` (Google Style) | Enforcing naming and structure rules.         |
| **Bad Practice**    | PMD              | `pmd`                       | Detecting dead code and error-prone patterns. |
| **Bytecode**        | Spotbugs         | `com.github.spotbugs`       | Finding null-pointer or threading issues.     |
| **Unit Testing**    | Surefire         | `test` (JUnit 5)            | 80% JaCoCo coverage threshold.                |
| **Mutation**        | Pitest           | `pitest`                    | 70% mutation kill threshold.                  |
| **CVE Scan**        | DependencyCheck  | `dependencyCheck`           | Fails on CVSS ≥ 7.0 vulnerabilities.          |

### CI/CD (GitHub Actions)

- **Parallel Jobs**: MVC and WebFlux quality jobs run simultaneously for fast feedback.
- **Jib**: Directly builds OCI-compatible images from Gradle without requiring a Docker daemon.
- **Aggregator**: A single `ci-complete` status check ensures all gates (tests, quality, security) are passed before merging.

---

## 7. Patterns & Implementation Summary

This Technical Test demonstrates the use of several production-grade patterns to ensure a clean, maintainable, and scalable codebase.

| Pattern                    | Implementation                        | Why it earns its place                                                |
| -------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| **CQRS**                   | `CustomerService.js`, Spring services | Decouples read and write logic for better scalability.                |
| **Domain Errors**          | `CustomerErrors.js`, `AppError.js`    | UI consumes business language, never raw transport codes.             |
| **Optimistic Updates**     | `useCustomers` hook                   | Enhances UX by showing new records before server confirmation.        |
| **Infinite Scroll**        | `useInfiniteScroll`                   | Native `IntersectionObserver` — no heavy scroll listeners.            |
| **Performance Rendering**  | `useDeferredValue`                    | Keeps input responsive during heavy concurrent re-renders.            |
| **Fault Isolation**        | `ErrorBoundary`                       | Prevents list failures from affecting the rest of the application.    |
| **Layered Error Handling** | `HttpClient` → Service → UI           | HTTP details never escape the transport layer.                        |
| **Generic Components**     | `DataTable` + `CustomerCard`          | Clean separation between table layout and row appearance.             |
| **Barrel Export**          | `ui/index.js`                         | One import path; MUI can be swapped with zero project-wide drift.     |
| **Smart Caching**          | `queryKeys` factory                   | Hierarchical keys prevent stale data across multiple modules.         |
| **Request Resilience**     | `HttpClient` timeouts                 | Fails fast on network stalls, preventing browser resource exhaustion. |
| **BFF Pattern**            | `LoginPage`, `README` docs            | RFC 9700 compliant — JWT never reaches the browser.                   |
| **Additive Migrations**    | Flyway V1 → V2                        | V1 API consumers never break when V2 schema lands.                    |
| **Defense in Depth**       | `@PreAuthorize` + security filters    | Multiple layers of security checks for every request.                 |

---

## 8. Manual Development Workflow

If you prefer manual control over the individual services instead of using the automated `start.sh` or Docker, you can launch them in separate terminals:

```bash
# Terminal 1 — Spring MVC
./gradlew :backend-mvc:bootRun --args='--spring.profiles.active=dev'

# Terminal 2 — Spring WebFlux
./gradlew :backend-webflux:bootRun --args='--spring.profiles.active=dev'

# Terminal 3 — React Frontend
cd frontend && npm run dev
```

---

## 9. Project Structure

```text
allica-test/
├── backend-mvc/       # Blocking, JPA, Hibernate Search (Lucene)
├── backend-webflux/   # Reactive, R2DBC, Netty (Event-Loop)
├── frontend/          # React 18, Rspack, TanStack Query, Zustand
├── config/            # Shared Checkstyle/PMD/Spotbugs rules
├── docker/            # Deployment (Docker Compose, Nginx, Dockerfiles)
└── .github/           # CI/CD Workflows (GitHub Actions)
```
