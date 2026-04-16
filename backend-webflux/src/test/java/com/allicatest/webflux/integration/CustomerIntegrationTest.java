package com.allicatest.webflux.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.allicatest.webflux.customer.*;

import reactor.test.StepVerifier;

/**
 * WebFlux integration tests.
 *
 * WebTestClient — the reactive equivalent of MockMvc.
 * SecurityMockServerConfigurers.mockJwt() — injects a mock JWT
 * without needing a real auth server running.
 *
 * Full stack under test:
 * Router → Handler → Service → R2DBC Repository → H2 → JSON response
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@DisplayName("Customer Integration Tests (WebFlux)")
class CustomerIntegrationTest {

    @Autowired
    WebTestClient webTestClient;

    @Autowired
    CustomerRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll().block();
    }

    private WebTestClient withRead() {
        return webTestClient.mutateWith(SecurityMockServerConfigurers.mockJwt()
                .authorities(new SimpleGrantedAuthority("SCOPE_customers:read")));
    }

    private WebTestClient withWrite() {
        return webTestClient.mutateWith(SecurityMockServerConfigurers.mockJwt()
                .authorities(new SimpleGrantedAuthority("SCOPE_customers:write")));
    }

    private static final LocalDate DOB = LocalDate.of(1990, 5, 15);

    // ── Security ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("returns 401 without token")
    void noToken_401() {
        webTestClient.get().uri("/api/v1/customers").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @DisplayName("POST returns 403 with read-only scope")
    void readScope_cannotCreate_403() {
        withRead()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))
                .exchange()
                .expectStatus()
                .isForbidden();
    }

    // ── Full CRUD flow ────────────────────────────────────────────────────────

    @Test
    @DisplayName("create → getById → getAll full journey")
    void fullCrudFlow() {
        var created = withWrite()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(CustomerDTO.V1Response.class)
                .returnResult()
                .getResponseBody();

        assertThat(created).isNotNull();

        withRead()
                .get()
                .uri("/api/v1/customers/{id}", created.id())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.firstName")
                .isEqualTo("Alice");

        withRead()
                .get()
                .uri("/api/v1/customers")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(CustomerDTO.V1Response.class)
                .hasSize(1);

        StepVerifier.create(repository.count()).expectNext(1L).verifyComplete();
    }

    // ── V1 vs V2 response ────────────────────────────────────────────────────

    @Test
    @DisplayName("V1 response does NOT contain fullName")
    void v1_noFullName() {
        withWrite()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))
                .exchange()
                .expectStatus()
                .isCreated();

        withRead()
                .get()
                .uri("/api/v1/customers")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$[0].fullName")
                .doesNotExist();
    }

    @Test
    @DisplayName("V2 response DOES contain fullName and status")
    void v2_hasFullNameAndStatus() {
        withWrite()
                .post()
                .uri("/api/v2/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))
                .exchange()
                .expectStatus()
                .isCreated();

        withRead()
                .get()
                .uri("/api/v2/customers")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$[0].fullName")
                .isEqualTo("Alice Smith")
                .jsonPath("$[0].status")
                .isEqualTo("ACTIVE");
    }

    // ── Duplicate prevention ──────────────────────────────────────────────────

    @Test
    @DisplayName("same name + DOB returns 409")
    void duplicate_409() {
        var body = new CustomerDTO.CreateRequest("Bob", "Jones", DOB);
        withWrite()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus()
                .isCreated();

        withWrite()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus()
                .isEqualTo(409)
                .expectBody()
                .jsonPath("$.error")
                .isEqualTo("Conflict");
    }

    // ── Validation ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("blank firstName returns 400")
    void blankFirstName_400() {
        withWrite()
                .post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new CustomerDTO.CreateRequest("", "Smith", DOB))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.error")
                .isEqualTo("Validation Failed");
    }

    // ── Not found ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/customers/9999 returns 404")
    void notFound_404() {
        withRead()
                .get()
                .uri("/api/v1/customers/9999")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.error")
                .isEqualTo("Not Found");
    }

    // ── Versioning headers ────────────────────────────────────────────────────

    @Test
    @DisplayName("response includes X-API-Version header")
    void response_hasVersionHeader() {
        withRead()
                .get()
                .uri("/api/v1/customers")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .valueEquals("X-API-Version", "v1");
    }
}
