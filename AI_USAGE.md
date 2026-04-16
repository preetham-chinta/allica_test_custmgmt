## Tool used

I used Claude as a coding agent, not to generate the project from scratch, but to implement decisions that is taken by me on the Technology choice, architectural pattern, and structural decision. All the code you see went through a human-in-the-loop. I reviewed every file before accepting it, questioned things that looked off, and in several cases explicitly asked Claude to undo or simplify something it had added.

---

## What I asked AI to generate

- Test code for both backends and the frontend — reviewed for correctness before accepting
- Initial Dockerfiles and docker-compose — manually adjusted profiles and structure after
- Gradle build files — I gave it my full Maven lifecycle list and it translated to Gradle DSL
- README — I specified sections and content, Claude wrote the prose
- Spring Boot and React boilerplate — application shells, config files, starter structure
- MUI theme and component wrappers — I defined the pattern, Claude implemented it

---

## What I decided myself

### Frontend

**Stack choices:**

- React 18 specifically for `useDeferredValue` — keeps the search input responsive while results load in the background without extra debounce complexity
- Rspack over Webpack — Rust-based, noticeably faster builds
- TanStack Query v5 — for infinite query, optimistic updates, and cache management. Also made EventBus and BehaviorSubject unnecessary once I understood what it handles natively
- Zustand — clean, no boilerplate, and `.getState()` works outside React components which I needed for the service layer
- MSW for tests — intercepts at the network layer, not mock functions. More realistic
- MUI v5 over Ant Design and AG Grid — enterprise-familiar. I designed the wrapper pattern myself where only `components/ui/` ever imports from MUI directly. Everything else uses our own components

**Patterns I directed:**

- Scroll-based pagination — I asked for `IntersectionObserver`-based infinite scroll and wrote the `useInfiniteScroll` hook logic myself. No scroll event listeners, just a sentinel element at the bottom of the list
- Debounced search — directed `useCustomerSearch` as a dedicated hook with a 300ms debounce and a separate suggestions query. The hook owns input state, TanStack owns the fetch
- Component layer structure — layout, domain, and UI library layers kept separate from the start. Was a structural call I made upfront
- ErrorBoundary around the list — so a crash in the customer table doesn't kill the add form. Independently recoverable sections
- Optimistic updates — new customer appears immediately, rolls back automatically if the server rejects it

**Error handling and constants:**

I asked for a proper layered approach here — HTTP codes never reach the UI layer. `HttpErrorMap.js` maps status codes to named error constants, `AppError` carries a `userMessage` safe for display and a `serverMessage` for logging only, and domain errors like `DuplicateCustomerError` mean components catch by type rather than checking `error.status === 409`. All endpoint paths, API versions, timeout values, and page sizes live in `constants/` — no magic strings or numbers anywhere in the codebase.

### Backend

- **MVC and WebFlux side by side** — my core idea. Same API, different runtime. Frontend switches between them via a toggle in the header. Shows both paradigms in one repo
- **Functional router for WebFlux** — `RouterFunction` + `HandlerFunction` instead of annotations, to make the contrast with MVC deliberate and visible
- **Hibernate Search with Lucene** — full-text prefix, fuzzy, and range search that SQL LIKE can't do efficiently. Lucene is used here because it needs no external service for the demo. In production I'd swap to Elasticsearch or OpenSearch — Hibernate Search supports that with a config change, no query logic changes
- **Flyway** — auditable migration history, easy to reason about. V2 is additive only (new columns, V1 fields untouched) so V1 consumers are never broken when V2 ships
- **Three versioning strategies** — URI path, `X-API-Version` header, and Accept MIME type, all through one filter. Different enterprise clients prefer different approaches so I wanted all three demonstrable
- **REST best practices throughout** — correct status codes (201, 204, 409 not 400 for conflict), plural resource names, no verbs in URLs, structured error responses matching Spring's `ProblemDetail` shape
- **GlobalExceptionHandler** — all validation errors, business exceptions, and unexpected errors handled centrally via `@RestControllerAdvice`. Field-level 400s, 404 for not found, 409 for conflict. Nothing leaks stack traces
- **Dual Spring profiles** — `@Profile("dev")` open so the demo runs without an auth server, `@Profile("!dev")` enforces JWT RS256. Production config visible in the same codebase
- **`@PreAuthorize` on every service method** — second layer of access control behind the URL rules

### Security

I asked for OWASP coverage across multiple layers:

- Access control at URL level and method level (`@PreAuthorize`) so neither can be bypassed alone
- JWT RS256 (asymmetric) rather than HS256, HttpOnly session cookie in the BFF so the token never reaches the browser
- Parameterised queries throughout, `@Valid` on every request body, Hibernate Search typed DSL — no injection paths
- Six security headers on every response via a filter — content type options, frame options, CSP, referrer policy, permissions policy, XSS protection
- OWASP Dependency Check in the build — fails on CVSS ≥ 7.0. Each suppression in `owasp-suppressions.xml` is documented with a reason rather than used as a blanket escape. The suppression file is how we keep the threshold strict without false positives blocking the build

### BFF

I introduced the BFF specifically for two things — backend switching and authentication. The `X-Backend` header in the BFF is what powers the MVC/WebFlux toggle in the UI without the frontend managing two base URLs. I also added auth at the BFF layer so the JWT lives server-side and the browser only ever holds an HttpOnly session cookie.

The initial BFF was built as a Spring Boot module. I later decided that's the wrong shape for a Next.js frontend — Next.js API routes and NextAuth.js already provide this natively with no extra service. The Spring Boot module was removed. The design is documented in the README with the Next.js approach explained.

### Build pipeline

I gave Claude my standard Maven lifecycle order and asked for the Gradle equivalents:

```
1.  dependency update check
2.  compile
3.  checkstyle, spotless, PMD, SpotBugs
4.  unit tests + JaCoCo
5.  integration tests
6.  PITest mutation testing
7.  OWASP CVE scan
8.  SonarQube
9.  bootJar
10. Jib Docker build
11. CycloneDX SBOM
```

All thresholds were mine — 80% JaCoCo, 70% PITest mutation kill rate, CVSS ≥ 7.0 for OWASP.

I also asked for shared config files at the root rather than duplicating them per module — `config/checkstyle/`, `config/pmd/`, `config/spotbugs/`. One ruleset for both modules, no drift. The PMD ruleset excludes `design` and `codestyle` categories deliberately — too noisy for Spring code. The Checkstyle suppressions and SpotBugs exclusions whitelist generated code from Lombok and Spring Security DSL which both produce false positives in static analysis tools.

Unit and integration tests are split by name convention — `*IntegrationTest` runs in a separate `integrationTest` Gradle task. No files moved, just a filter. Matches the Maven surefire/failsafe split.

### CI and branching

GitHub Flow over Git Flow — one `main` branch, feature branches, PRs. The extra branches in Git Flow aren't worth it here.

Pipeline order is deliberate: quality gates run first, then unit tests, then integration tests. If checkstyle fails, tests don't waste time running. PITest and SonarQube run on main only — too slow for every PR.

`dorny/test-reporter` publishes JUnit results as PR annotations so failed tests are visible without digging through logs. Every job uploads its reports as artifacts. `ci-complete` is the single required check in branch protection — one green tick, not five.

---

## Where I corrected AI

**Spring Boot BFF built and removed** — Claude built a full `backend-bff` Spring Boot module with security config, proxy controller, and WebClient token relay. Technically correct. I questioned why we needed a separate service when Next.js API routes handle this natively. We agreed it was the wrong shape for a React frontend and removed it entirely.

**BehaviorSubject and EventBus** — Claude introduced a hand-rolled `BehaviorSubject` class and a `BackendEventBus` for notifying hooks when the backend switches. I questioned them. Zustand's `.getState()` handles non-React state reads synchronously already, and TanStack refetches automatically when the queryKey changes. Both were solving problems that didn't exist. Removed both.

**Separate tokenStore.js** — Claude suggested a standalone file for JWT storage. We already have Zustand with stores in `store/index.js`. Added `useAuthStore` there instead — two minutes, consistent with the rest.

**Thin hooks fragmentation** — Claude proposed `useGetCustomers`, `useCreateCustomer`, `useSearchCustomers` as three separate files. Too much for this scope. Kept two hooks.

**Over-engineering the service layer** — Claude proposed separate `CustomerQueryService` and `CustomerCommandService` classes in two files. I asked for one class with two clearly commented sections instead. CQRS as a comment header, not a file-per-class rule.

**Magic strings everywhere** — early generated code had `"v1"`, `"v2"`, `"/customers"`, `10000` scattered across service layer, hooks, and components. I asked for a constants layer. `ApiEndpoints.js`, `ErrorCodes.js`, and `HttpErrorMap.js` were added.

**PMD and SpotBugs noise** — initial static analysis config was too aggressive. PMD flagged Spring `@Service` classes for design rule violations (they're intentionally large in enterprise code). SpotBugs flagged Lombok-generated code as potential null issues. Asked for curated rulesets and properly documented exclusion files rather than dropping thresholds globally.

## **Weak test assertions** — a few generated tests checked response status only and ignored the body. A 404 test that only calls `isNotFound()` isn't testing the GlobalExceptionHandler, it's testing Spring. Rewrote those to verify the full response shape.

## Approximate time breakdown

Since I was using Claude as a code generator, I took the opportunity to go further than the base requirements and add extra layers — full build pipeline, mutation testing, security headers, BFF pattern, MUI component library, proper error handling. This is what the ~6 hours reflects.

- Backend (both modules): ~2 hours
- Frontend (stack, MUI, hooks, service layer): ~2 hours
- Tests, build pipeline, CI: ~1 hour
- Auth, BFF, security, documentation: ~1 hour

---

## Overall

AI was useful as an implementation tool, not a decision-making one. The stack, the patterns, the structure — all came from me directing the work. Where Claude took initiative and added things I hadn't asked for, I removed them. The final codebase is what I would have manually configured and implemented before, just faster. In the process, there is not code which inlcudes business logic and the implementation of a particular stack is all understood by me and validated before confirming on the changes.
