# AI_USAGE.md

This document summarises all architectural decisions, technology choices, and
design patterns introduced during AI-assisted development of this assessment.
Each section covers what was built, why it was chosen, and its advantage over
the alternative.

---

## 1. Project Structure

- Gradle multi-module project: `backend-mvc`, `backend-webflux`, `frontend`
- Single `settings.gradle` at root — one build, three modules
- Shared `config/` at root for Checkstyle, PMD, SpotBugs — not duplicated per module
- Shared Flyway migrations per module — additive versioning (V1 → V2 → V3)
- Docker and CI separate from application code (`docker/`, `.github/workflows/`)

---

## 2. Backend — Spring MVC vs Spring WebFlux (side-by-side)

### What was built
Both backends expose **identical REST API endpoints** on different ports (8080, 8081).
The frontend switches between them at runtime via a header toggle — zero code changes.

### Spring MVC (port 8080)
- Blocking I/O — one thread per request
- Tomcat servlet container
- JPA + Hibernate — synchronous database access
- `@RestController` + `@RequestMapping` routing
- Hibernate Search (Lucene backend) — full-text search with DSL
- `MockMvc` + `@WebMvcTest` for controller tests
- `@SpringBootTest` + H2 for integration tests

### Spring WebFlux (port 8081)
- Non-blocking, event-loop I/O — threads never blocked on I/O
- Netty server
- R2DBC — reactive database driver (returns `Mono<T>` / `Flux<T>`)
- Functional router pattern — `RouterFunction` + `HandlerFunction` instead of annotations
- `WebTestClient` for controller tests — supports async assertions
- `StepVerifier` (Reactor Test) — verifies reactive stream emissions step by step

### Why both
- Demonstrates understanding of both paradigms in one repo
- WebFlux preferred when: high concurrency + I/O-bound work, streaming (SSE/WebSocket), full reactive stack
- Spring MVC preferred when: simpler CRUD, team familiarity, blocking integrations exist

---

## 3. API Versioning — Three Strategies

### What was built
A single `ApiVersioningFilter` (MVC) / `ReactiveApiVersioningFilter` (WebFlux) supports:

- **URI path** — `/api/v1/customers` (default, most explicit)
- **Custom header** — `X-API-Version: v2`
- **Accept MIME type** — `Accept: application/vnd.allicatest.v2+json`

Every response includes:
```
X-API-Version: v1
X-API-Supported-Versions: v1, v2
```

### V1 vs V2 contract
- V1 — frozen: `id, firstName, lastName, dateOfBirth, createdAt`
- V2 — additive only: adds `fullName, email, status, updatedAt` — V1 fields unchanged
- Flyway V2 migration adds `email`, `status`, `updated_at` columns additively
- V1 clients never break when V2 launches — backward compatibility enforced at schema level

### Why this approach
- URI versioning is most visible to developers and proxies
- Header/Accept versioning allows content negotiation without URL changes
- Additive V2 means zero regression risk on V1 consumers

---

## 4. Database — Flyway Migrations

### What was built
- V1 — baseline schema (`customers` table, unique constraint)
- V2 — additive migration (`email`, `status`, `updated_at`) — V1 API unaffected
- V3 — dev seed data only, excluded from prod via Spring profile

### H2 (dev/test) → PostgreSQL (prod)
- Two YAML lines swap the database — no code changes
- Same Flyway SQL runs against both — ANSI SQL throughout

### Why Flyway over Liquibase
- SQL-native — no XML/YAML abstraction layer
- Simpler mental model — V1 → V2 → V3 is explicit and auditable
- Standard in Spring Boot ecosystem

---

## 5. Security

### Resource servers (both backends)

- **`@Profile("dev")` = `permitAll`** — demo works without auth server
- **`@Profile("!dev")` = JWT RS256** — `spring-boot-starter-oauth2-resource-server`
- `@PreAuthorize("hasAuthority('SCOPE_customers:read')")` on every service method
- Two-layer defence: URL-level auth + method-level auth
- CSRF disabled on resource servers — correct for stateless JWT Bearer APIs

### Security headers — OWASP A05 (Security Misconfiguration)

Added via `SecurityHeadersFilter` (MVC, `OncePerRequestFilter`, `@Order(1)`) and
`SecurityHeadersWebFilter` (WebFlux, `WebFilter`, `@Order(-2)`):

| Header | Value | Mitigates |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing attacks |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `0` | Disables broken IE auditor (CSP replaces it) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Path leakage to third parties |
| `Permissions-Policy` | `geolocation=(), camera=()...` | Disables unused browser APIs |
| `Content-Security-Policy` | `default-src 'none'` | XSS, data injection |

### Frontend auth — Zustand store

- `useAuthStore` in Zustand — `token`, `isAuthed`, `login()`, `logout()`
- Stored in `sessionStorage` (persisted via Zustand middleware) — clears on tab close
- `HttpClient` reads `useAuthStore.getState().token` — Zustand's non-React escape hatch
- Attaches `Authorization: Bearer <token>` on every request
- `ProtectedRoute` — guards all routes, redirects to `/login` with `location.state.from`
- `LoginPage` — dev mode (hardcoded token), explains production Next.js flow

### BFF pattern — why Next.js, not Spring Boot

- A separate Spring Boot BFF was built then **intentionally removed**
- Next.js API routes + NextAuth.js IS the BFF for a React frontend
- Browser → Next.js server (HttpOnly session cookie) → Spring Boot (JWT Bearer)
- JWT never reaches the browser — XSS cannot steal what JS cannot read
- `SameSite=Strict` on session cookie mitigates CSRF without extra tokens
- Spring Boot BFF only makes sense when: multiple frontends share one BFF, or non-Next.js frontend
- RFC 9700 (OAuth 2.0 Security Best Current Practice for SPAs) recommends this pattern

---

## 6. Frontend — React 18 + MUI v5

### Technology choices

| Technology | Chosen | Alternative considered | Reason |
|---|---|---|---|
| UI library | MUI v5 | Ant Design, shadcn/Radix | MUI recognised in enterprise/fintech interviews, complete component set |
| State management | Zustand | Redux | Zero boilerplate, `.getState()` for non-React code, selector-based subscriptions |
| Server state | TanStack Query v5 | SWR, React Query v4 | Most complete: infinite query, optimistic updates, prefetch, cache invalidation |
| Forms | React Hook Form + Zod | Formik | RHF is uncontrolled (performant), Zod gives compile-time type safety |
| Build tool | Rspack | Webpack, Vite | Rspack is Rust-based Webpack-compatible — 5-10x faster than Webpack |
| Test framework | Jest + MSW | Vitest, Playwright | Jest is universal, MSW intercepts at network layer (not mock functions) |

### MUI v5 — component library wrapper pattern

**Rule enforced by convention:** `@mui/material` is only imported inside `src/components/ui/`.
Everything else imports from `@/components/ui` only.

```
components/ui/
  theme.js        ← palette, typography, shape, 10 MUI component overrides
  Button.jsx      ← MuiButton + loading state (CircularProgress)
  DataTable.jsx   ← generic: columns config, sort, skeleton rows, empty state
  SearchField.jsx ← TextField + suggestions + history + ARIA
  Primitives.jsx  ← Badge, PageHeader, LoadingSpinner, EmptyState, ErrorAlert
  index.js        ← barrel export — the only import path
```

**Why this wrapper layer:**
- Swap MUI for another library by changing 6 files, not 60
- Enforces our prop API over MUI's raw API
- Shared defaults (theme, size, variant) applied once
- Consumers never know which library is underneath

### DataTable — generic column config pattern

```js
const columns = [
  { field: "name",   header: "Customer", sortable: true,
    render: (row) => <CustomerCard customer={row} highlight={highlight} /> },
  { field: "status", header: "Status",   sortable: false,
    render: (row) => <Badge status={row.status} /> },
]
```

- `DataTable` owns layout — knows nothing about customers
- `CustomerCard` owns appearance — injected via `render()`
- `Badge` is reusable for any entity status display

---

## 7. Frontend Architecture — Service Layer

### Dependency chain

```
Component
    ↓
  Hook  (TanStack Query, IntersectionObserver, useDeferredValue)
    ↓
  CustomerService  (query / command split, domain error mapping)
    reads useBackendStore.getState() — no React dependency
    ↓
  HttpClient  (timeout, error mapping, auth header, signal forwarding)
    builds URL from ENDPOINTS constants — never raw strings
    ↓
  fetch()
```

### Constants — no magic strings anywhere

```
constants/
  ApiEndpoints.js  ← ENDPOINTS builders, API_VERSIONS, API_DEFAULTS
  ErrorCodes.js    ← ERROR_CODES + ERROR_MESSAGES
  HttpErrorMap.js  ← HTTP status → error code mapping
```

- `ENDPOINTS.CUSTOMERS()` not `"/customers"` — breaks at call site if wrong
- `API_VERSIONS.V1` not `"v1"` — rename in one place, refactors everywhere
- `API_DEFAULTS.TIMEOUT_MS` — `10_000` named, not scattered as magic numbers

### HttpClient — request timeout

- Default 10s timeout via `AbortController` + `setTimeout`
- Suggest endpoint uses 3s override — typeahead is useless after 3 seconds
- TanStack's cancellation signal forwarded to `fetch()` — in-flight requests cancelled on query invalidation
- No manual `useRef` — TanStack owns the AbortController lifecycle

### CustomerService — CQRS split in one class

```java
class CustomerService {
  // ── Queries ────────────────────────────────
  getAll({ signal })
  getById(id, { signal })
  search(params, { signal })     // V1=GET, V2=POST
  suggest(prefix, limit)         // always V2, 3s timeout

  // ── Commands ───────────────────────────────
  create(data)                   // maps 409 → DuplicateCustomerError
}
```

- Mirrors CQRS split in the Spring backend
- Non-React: reads `useBackendStore.getState()` — Zustand's escape hatch
- Maps `AppError` (HTTP layer) → domain errors (business layer)

### Error handling — layered

```
HTTP 409
    ↓ HttpClient maps via HttpErrorMap
AppError(code: "ERR_DUPLICATE_CUSTOMER", httpStatus: 409, serverMessage: "...")
    ↓ CustomerService maps to domain error
DuplicateCustomerError(userMessage: "A customer with this name already exists.")
    ↓ Hook catches
Component shows error.userMessage — never sees HTTP codes
```

- `userMessage` — safe for UI, from `ERROR_MESSAGES` constants
- `serverMessage` — raw server string, for logging only, never shown in UI
- Components catch `instanceof DuplicateCustomerError` — not `if (err.status === 409)`

### TanStack Query wrappers — `queryHooks.js`

```js
useServiceQuery(key, fn, options)
useServiceInfiniteQuery(key, fn, options)
useServiceMutation(fn, options)
```

- Smart retry in one place — never retry 4xx (409 won't change on retry)
- `staleTime: 30_000` — data fresh for 30s, no redundant refetches
- `gcTime: 300_000` — cache kept 5min after unmount
- `keepPreviousData` — previous page shown while next loads (no blank flash)
- Signal from TanStack passed to `queryFn` automatically — no manual `useRef`
- `retry: false` on mutations — fail fast on writes

### Query key factory

```js
queryKeys.customers.all()                  // invalidates everything
queryKeys.customers.search({ q, backend }) // granular cache entry
```

- Hierarchical — `invalidateQueries(all())` clears list + search + detail
- Backend + version in key — TanStack auto-refetches when backend switches

---

## 8. React 18 Patterns

### `useDeferredValue` — non-blocking search

```js
const deferredQuery = useDeferredValue(committedQuery);
const isStale       = committedQuery !== deferredQuery;
```

- Input stays responsive at 60fps — updates synchronously
- Results update in a lower-priority render — no blocking
- `isStale` dims the table (opacity 0.6) during transition — no blank flash
- Alternative (debounce alone): still blocks for 300ms, no concurrent rendering

### `IntersectionObserver` — infinite scroll

```js
const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage);
<div ref={sentinelRef} />  // sentinel at bottom of list
```

- No `onScroll` event listener — browser calls back on intersection
- Works with any scroll container
- Fires off main thread — doesn't block rendering
- Disconnects automatically on unmount

### Optimistic updates

- New customer appears in list before server confirms
- Snapshot taken on `onMutate` — rolled back on error
- `cancelQueries` prevents race condition between optimistic and real data

### ErrorBoundary

- Class component wrapping `CustomerList` only
- List crash doesn't affect `CustomerForm` — fault isolation
- `getDerivedStateFromError` — class-only lifecycle, intentional
- `fallbackTitle` + `fallbackMessage` props — configurable per boundary

---

## 9. Build Pipeline — Gradle (Maven equivalents)

| Maven | Gradle | Purpose |
|---|---|---|
| `mvn enforcer:enforce` | Dependency constraints | Minimum version enforcement |
| `mvn versions:display-dependency-updates` | `dependencyUpdates` (ben-manes) | Outdated dep detection |
| `mvn checkstyle:check` | `checkstyle` (built-in) | Google Java Style, 120 char limit |
| `mvn spotless:check` | `com.diffplug.spotless` | Palantir Java Format auto-formatter |
| `mvn pmd:check` | `pmd` (built-in) | Static analysis — bad practices, dead code |
| `mvn spotbugs:check` | `com.github.spotbugs` | Bytecode analysis — null deref, thread issues |
| `mvn surefire:test` | `test` (filter excludes `*IntegrationTest`) | Unit tests — no Spring context |
| `mvn failsafe:integration-test` | `integrationTest` (filter includes `*IntegrationTest`) | Full Spring context tests |
| `mvn jacoco:report` | `jacoco` (built-in) | Coverage report + 80% threshold |
| `mvn pitest:mutationCoverage` | `info.solidsoft.pitest` | Mutation testing — 70% kill threshold |
| `mvn dependency-check:check` | `org.owasp.dependencycheck` | CVE scan against NVD, fail on CVSS ≥ 7.0 |
| `mvn sonar:sonar` | `org.sonarqube` | Full quality dashboard |
| `mvn package` | `bootJar` | Executable Spring Boot JAR |
| `mvn jib:dockerBuild` | `com.google.cloud.tools.jib` | Docker image — no daemon needed |
| `mvn cyclonedx:makeAggregateBom` | `org.cyclonedx.bom` | SBOM — audit artifact |

### Unit vs integration test separation — no files moved

```groovy
test {
    filter { excludeTestsMatching '*IntegrationTest' }  // fast ~5s
}
tasks.register('integrationTest', Test) {
    filter { includeTestsMatching '*IntegrationTest' }  // slow ~60s
}
```

- Developers run `./gradlew test` constantly — fast feedback
- `integrationTest` runs in CI after unit tests pass
- No separate source sets — filter by name convention

### Jib — Docker without Docker daemon

- Builds OCI-compatible image directly from Gradle
- No `Dockerfile` needed for CI — pushes layer-by-layer to GHCR
- Only changed layers pushed — much faster than `docker build + docker push`
- Dockerfiles still exist for `docker compose` local development
- Runs as non-root user (`user = '1000'`) — security best practice

### Shared config files at root level

```
config/
  checkstyle/
    checkstyle.xml     ← Google Java Style, Spring/Lombok relaxations
    suppressions.xml   ← generated code, test classes, config classes
  pmd/
    ruleset.xml        ← curated: bestpractices, errorprone, performance
  spotbugs/
    exclude.xml        ← Lombok-generated bytecode, Spring Security DSL
```

- One set of rules for both modules — no drift between MVC and WebFlux
- Suppressions documented with comments explaining why each exists

---

## 10. CI Pipeline — GitHub Actions

### Job structure

```
Every PR:
  validate          → dependencyUpdates (informational)
  quality-mvc/flux  → compile + checkstyle + spotless + PMD + SpotBugs
  test-mvc/flux     → unit tests + JaCoCo 80%
  integration-*     → Spring context tests
  frontend          → Jest + Rspack build
  owasp             → CVE scan (continue-on-error on PRs)

Main branch only:
  mutation          → PITest 70% kill threshold
  sonar             → SonarQube dashboard
  deliver           → bootJar + Jib push to GHCR + CycloneDX SBOM

Always:
  ci-complete       → aggregator — single required status check
```

### Key decisions

- **Parallel quality jobs** — MVC and WebFlux quality gates run simultaneously
- **PITest on main only** — mutation testing takes 10-20min, too slow for every PR
- **OWASP `continue-on-error`** on PRs — informational, blocking on main
- **`ci-complete` aggregator** — one required check in branch protection, not many
- **Concurrency group** — `cancel-in-progress: true` cancels stale PR runs
- **Jib** in deliver job — no Docker daemon required in GitHub Actions runner
- **SBOM 90-day retention** — audit artifact for supply chain security compliance

---

## 11. Patterns Demonstrated

| Pattern | Where | Why it earns its place |
|---|---|---|
| CQRS (query/command split) | `CustomerService.js`, Spring services | Mirrors backend — reads and writes separated |
| Domain errors over HTTP codes | `CustomerErrors.js`, `AppError.js` | Components use business language not transport codes |
| Subject/Observer (simplified) | `useBackendStore` → queryKey → TanStack | TanStack reacts to queryKey change — no EventBus needed |
| Optimistic updates | `useCustomers` | UX — new row appears before server confirms |
| Infinite scroll (IntersectionObserver) | `useInfiniteScroll` | No scroll listeners, browser-native, off main thread |
| `useDeferredValue` | `useCustomerSearch` | React 18 concurrent rendering — input never lags |
| ErrorBoundary (fault isolation) | `CustomersPage` | List crash doesn't kill the form |
| Layered error handling | `HttpClient` → `CustomerService` → UI | HTTP codes never escape the transport layer |
| Generic component with render prop | `DataTable` + `CustomerCard` | Table generic, appearance injectable |
| Barrel export with dependency rule | `components/ui/index.js` | MUI swappable in 6 files, not 60 |
| Smart cache invalidation | `queryKeys` factory + `invalidateQueries` | Hierarchical keys prevent stale data |
| Smart retry | `queryHooks.js` | Never retry 4xx — pointless and harmful |
| Request timeout | `HttpClient` | Hung requests fail fast — production failure mode |
| Token from store outside React | `useAuthStore.getState()` | Consistent Zustand escape hatch pattern |
| Protected routes | `ProtectedRoute` + `location.state.from` | Standard auth flow, preserves intended destination |
| BFF via Next.js (documented) | `LoginPage`, `README` | RFC 9700 compliant — JWT never in browser |
| Security headers filter | Both backends | OWASP A05 — every response, even error responses |
| Flyway additive migrations | V1 → V2 → V3 | V1 API never breaks when V2 schema lands |
| Dual Spring profiles | `@Profile("dev")` / `@Profile("!dev")` | Demo works, production security visible |
| Method-level security | `@PreAuthorize` on every service | Defence in depth — URL rules + method rules |

---

## 12. Technologies and Versions

### Backend
- Java 21 — virtual threads available, modern records and sealed classes
- Spring Boot 3.2.4 — latest stable at time of writing
- Hibernate Search 7.1.1 — Lucene backend for full-text search
- R2DBC — reactive database driver for WebFlux module
- Flyway 10 — database migration, required for PostgreSQL 15+
- JaCoCo 0.8.11 — coverage with 80% threshold
- PITest 1.15.0 — mutation testing with 70% kill threshold

### Frontend
- React 18.3 — concurrent rendering, `useDeferredValue`
- MUI v5.16 — component library, ThemeProvider, DataGrid-free (custom DataTable)
- TanStack Query v5 — server state, infinite query, optimistic updates
- Zustand v5 — client state, `getState()` for non-React code
- React Hook Form v7 + Zod v3 — forms with compile-time validation
- Rspack v1 — Rust-based Webpack-compatible bundler
- Jest v29 + MSW v2 — testing with real network interception

### Build / CI
- Gradle wrapper (no version lock) — consistent across developer machines
- Checkstyle 10.14.2 — Google Java Style
- Spotless 6.25.0 — Palantir Java Format
- PMD 7.0.0 — curated ruleset
- SpotBugs 6.0.9 — bytecode analysis
- OWASP Dependency Check 9.0.9 — CVE scanning against NVD
- SonarQube plugin 4.4.1 — full quality dashboard
- Jib 3.4.2 — Docker without daemon
- CycloneDX 1.8.2 — SBOM generation
- GitHub Actions — parallel jobs, concurrency groups, branch protection
