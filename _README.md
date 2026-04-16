# Allica Bank Technical Assessment

Customer management system built to demonstrate Spring MVC vs Spring WebFlux side by side. Both backends expose identical API endpoints. The frontend switches between them at runtime — zero code changes.

---

## Running the demo

### Option A — Docker (everything at once)

```bash
docker compose -f docker/docker-compose.yml up
```

### Option A — Automated Setup & Start (Recommended)

This project includes self-bootstrapping scripts to manage environment checks and start everything with a single command.

```bash
# 1. Automated dependency installation and check
./setup.sh

# 2. Start MVC, WebFlux and Frontend concurrently
./start.sh
```

### Option B — Docker (everything at once)

```bash
docker compose -f docker/docker-compose.yml up
```

### Option C — Manual Individual Launch

If you prefer manual control, open three terminals:

```bash
# Terminal 1 — Spring MVC (blocking, Tomcat, JPA, Hibernate Search)
./gradlew :backend-mvc:bootRun --args='--spring.profiles.active=dev'
# → http://localhost:8080

# Terminal 2 — Spring WebFlux (reactive, Netty, R2DBC)
./gradlew :backend-webflux:bootRun --args='--spring.profiles.active=dev'
# → http://localhost:8081

# Terminal 3 — React frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000
```

> **Demo tip:** Use the **Backend** toggle in the top-right header to switch between MVC and WebFlux live. The `X-API-Version` response header changes. Same endpoints, different runtime.

---

## API endpoints (identical on both backends)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers` | List all customers |
| GET | `/api/v1/customers/{id}` | Get by ID |
| GET | `/api/v1/customers/search?query=alice` | Full-text search (MVC only) |
| POST | `/api/v2/customers/search` | Advanced search — fuzzy, date range (MVC only) |
| GET | `/api/v2/customers/suggest?prefix=ali` | Typeahead suggestions (MVC only) |
| GET | `/api/v2/customers` | Extended response: fullName, status, email |

### API versioning — three strategies

```bash
# 1. URI path (default)
GET /api/v1/customers

# 2. Custom header
GET /api/customers
X-API-Version: v2

# 3. Accept vendor MIME type
GET /api/customers
Accept: application/vnd.allicatest.v2+json
```

Every response includes:
```
X-API-Version: v1
X-API-Supported-Versions: v1, v2
```

### V1 vs V2 response shape

```json
// V1 — frozen contract
{ "id": 1, "firstName": "Alice", "lastName": "Smith",
  "dateOfBirth": "1985-03-10", "createdAt": "2026-01-01T10:00:00" }

// V2 — additive (V1 unchanged)
{ "id": 1, "firstName": "Alice", "lastName": "Smith",
  "fullName": "Alice Smith", "dateOfBirth": "1985-03-10",
  "email": "alice@example.com", "status": "ACTIVE",
  "createdAt": "2026-01-01T10:00:00", "updatedAt": "2026-01-01T10:00:00" }
```

---

## Running tests

```bash
# Spring MVC — unit + integration + JaCoCo 80% threshold
./gradlew :backend-mvc:check

# Spring WebFlux — StepVerifier + WebTestClient + JaCoCo 80% threshold
./gradlew :backend-webflux:check

# OWASP CVE scan (requires NVD API key)
./gradlew :backend-mvc:dependencyCheckAnalyze
./gradlew :backend-webflux:dependencyCheckAnalyze

# Frontend — Jest + MSW + coverage
cd frontend && npm test
cd frontend && npm run test:coverage

# View reports
open backend-mvc/build/reports/jacoco/test/html/index.html
open backend-webflux/build/reports/jacoco/test/html/index.html
open frontend/coverage/index.html
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend  :3000                               │
│         React 18 · MUI v5 · TanStack Query · Rspack             │
│                                                                  │
│   ┌─────────────────┐   ┌───────────────────────────────────┐   │
│   │  Add customer   │   │          Customers                │   │
│   │  (MUI form)     │   │  SearchField + DataTable          │   │
│   │                 │   │  Infinite scroll (IntersectionObs)│   │
│   └─────────────────┘   └───────────────────────────────────┘   │
│                                                                  │
│   HttpClient → CustomerService → useCustomers / useSearch        │
│   MUI theme → ui/ wrapper layer → components                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ ACTIVE_BACKEND toggle
           ┌──────────────┴──────────────┐
           │                             │
┌──────────▼──────────┐       ┌──────────▼──────────┐
│  Spring MVC  :8080  │       │ Spring WebFlux :8081 │
│  Java 21             │       │ Java 21              │
│  Tomcat (blocking)   │       │ Netty (non-blocking) │
│  JPA + Hibernate     │       │ R2DBC (reactive)     │
│  Hibernate Search    │       │ Functional router    │
│  @RestController     │       │ RouterFunction       │
└──────────┬──────────┘       └──────────┬──────────┘
           └──────────────┬──────────────┘
                          │
                   H2 (dev) / PostgreSQL (prod)
                   Flyway migrations (V1 → V2 → V3)
```

---

## Frontend architecture

### Component hierarchy

```
App (ThemeProvider + QueryClientProvider + BrowserRouter)
  AppHeader (MUI AppBar + ToggleButtonGroup)
  CustomersPage
    PageSection "Add customer"  (MUI Paper)
      CustomerForm              (MUI Grid + TextField + Button)
    PageSection "Customers"     (MUI Paper)
      ErrorBoundary             (isolates list crashes from form)
        CustomerList
          SearchField           (MUI TextField + suggestions)
          DataTable             (generic, column config)
            CustomerCard        (MUI Avatar + Badge per row)
  AppFooter
```

### ui/ component library layer

```
components/ui/          ← THE ONLY directory that imports @mui/material
  theme.js              ← palette, typography, shape, 10 component overrides
  Button.jsx            ← MuiButton + loading spinner
  DataTable.jsx         ← generic: columns config, sort, skeleton rows
  SearchField.jsx       ← TextField + suggestions dropdown + history
  Primitives.jsx        ← Badge, PageHeader, LoadingSpinner, EmptyState, ErrorAlert
  index.js              ← barrel export — one import path for all ui/ components
```

**Rule:** Nothing outside `components/ui/` ever imports from `@mui/material`. Components, hooks, pages — all import from `@/components/ui`. Swap MUI tomorrow by changing 6 files, not 60.

### Service layer dependency chain

```
Component
    ↓
  Hook  (TanStack Query, useInfiniteScroll, useDeferredValue)
    ↓
  CustomerService          (query / command split, domain error mapping)
  reads useBackendStore.getState() — no React dependency
    ↓
  HttpClient               (timeout, error mapping, CSRF, signal forwarding)
  builds URL from ENDPOINTS constants, never raw strings
    ↓
  fetch()
```

### Key patterns

| Pattern | Where | Why |
|---|---|---|
| TanStack Query cache | `queryClient.js` | staleTime, keepPreviousData, smart retry |
| Infinite scroll | `useInfiniteScroll` | IntersectionObserver, no scroll events |
| Optimistic updates | `useCustomers` | new row appears before server confirms |
| `useDeferredValue` | `useCustomerSearch` | input stays at 60fps during search |
| CQRS in service | `CustomerService` | query / command sections clearly divided |
| Domain errors | `CustomerErrors.js` | components catch by type, not HTTP code |
| ErrorBoundary | `CustomersPage` | list crash doesn't affect form |
| Barrel export | `ui/index.js` | one import path, easy to swap library |

---

## Spring MVC vs Spring WebFlux

| | Spring MVC | Spring WebFlux |
|---|---|---|
| Threading | One thread per request (blocked during I/O) | Event loop — thread never blocked |
| Database driver | JPA / JDBC (blocking) | R2DBC (reactive) |
| Server | Tomcat | Netty |
| Routing | `@RestController` + `@RequestMapping` | `RouterFunction` + `HandlerFunction` |
| Testing | `MockMvc` + `@WebMvcTest` | `WebTestClient` + `StepVerifier` |
| Programming model | Synchronous — normal Java returns | Reactive — `Mono<T>` / `Flux<T>` |

**When to choose WebFlux:** High concurrency with I/O-bound work (many slow external calls), streaming responses (SSE, WebSocket), when the entire stack can be reactive. For standard CRUD at moderate scale, Spring MVC is simpler and equally capable.

---

## Database (Flyway migrations)

```
V1 — baseline schema (customers table, unique constraint)
V2 — additive: email, status, updated_at  ← V1 API unchanged after this
V3 — dev seed data only (excluded in prod)
```

Switching database: two YAML lines.

```yaml
# H2 (dev, default)
spring.datasource.url: jdbc:h2:mem:allicatest

# PostgreSQL (staging/prod)
spring.datasource.url: ${DB_URL}
spring.jpa.database-platform: org.hibernate.dialect.PostgreSQLDialect
```

Flyway runs the same SQL migrations against any ANSI-SQL database automatically on startup.

---

## Security

### JWT RS256 on both resource servers

```
@Profile("dev")  → permitAll — no token needed for demo
@Profile("!dev") → full JWT RS256 (Spring Security OAuth2 Resource Server)
```

`@PreAuthorize` on every service method — method-level security as a second layer.

```java
@PreAuthorize("hasAuthority('SCOPE_customers:read')")
public Flux<CustomerDTO.V1Response> findAll() { ... }

@PreAuthorize("hasAuthority('SCOPE_customers:write')")
public Mono<CustomerDTO.V1Response> create(...) { ... }
```

### Security headers (OWASP A05)

Both backends add on every response via filter:

| Header | Value | Protects against |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `0` | Disables broken IE auditor |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Path leakage |
| `Permissions-Policy` | `geolocation=()...` | Unused browser APIs |
| `Content-Security-Policy` | `default-src 'none'` | XSS, data injection |

### OWASP Dependency Check

```bash
./gradlew :backend-mvc:dependencyCheckAnalyze      # fail on CVSS ≥ 7.0
./gradlew :backend-webflux:dependencyCheckAnalyze
```

### BFF pattern (production auth)

In production we would use **Next.js API routes + NextAuth.js** as the BFF — not a separate Spring Boot service.

```
Browser → Next.js server (BFF) → Spring Boot resource servers
          ↕ HttpOnly session cookie (JS cannot read)
          Next.js adds Authorization: Bearer internally
```

NextAuth.js handles Authorization Code + PKCE, stores the token in an encrypted server-side session, and sets an `HttpOnly` session cookie. JavaScript never sees the JWT. XSS cannot steal what it cannot read. This follows RFC 9700 (OAuth 2.0 Security Best Current Practice for SPAs).

A dedicated Spring Boot BFF is the right choice when multiple teams share the BFF, or when multiple frontends (web, mobile, partner portals) each need their own BFF. For a single Next.js frontend, Next.js itself is the BFF.

---

## Project structure

```
allica-test/
├── backend-mvc/                   Spring MVC — Java 21, JPA, Hibernate Search
│   ├── src/main/java/...
│   │   ├── customer/v1/           V1 controller (frozen contract)
│   │   ├── customer/v2/           V2 controller (additive)
│   │   ├── customer/search/       Hibernate Search DSL
│   │   ├── security/              JWT + @Profile dev/prod
│   │   └── versioning/            URI/Header/Accept filter
│   ├── src/main/resources/db/     Flyway V1, V2, V3
│   └── src/test/java/...
│       ├── unit/                  Mockito + MockMvc + mock JWT
│       └── integration/           H2 full stack
│
├── backend-webflux/               Spring WebFlux — Java 21, R2DBC, Netty
│   ├── src/main/java/...
│   │   ├── handler/               CustomerHandler (functional)
│   │   ├── router/                CustomerRouter (RouterFunction)
│   │   └── security/              ReactiveSecurityConfig
│   └── src/test/java/...
│       ├── unit/                  StepVerifier on Mono/Flux
│       └── integration/           WebTestClient + mock JWT
│
├── frontend/                      React 18 + MUI v5 + Rspack + Jest
│   └── src/
│       ├── components/
│       │   ├── ui/                MUI wrapper layer (theme + generic components)
│       │   ├── customer/          CustomerForm, CustomerCard, CustomerList
│       │   ├── layout/            AppHeader, AppFooter, PageSection
│       │   └── common/            ErrorBoundary
│       ├── hooks/                 useCustomers, useCustomerSearch, useInfiniteScroll
│       ├── services/              CustomerService (query/command split)
│       ├── lib/                   HttpClient, queryHooks, queryClient
│       ├── constants/             ApiEndpoints, ErrorCodes, HttpErrorMap
│       ├── errors/                AppError, CustomerErrors
│       └── store/                 Zustand: backend + version state
│
└── docker/
    ├── Dockerfile.mvc
    ├── Dockerfile.webflux
    ├── Dockerfile.frontend
    ├── nginx.conf
    └── docker-compose.yml
```
