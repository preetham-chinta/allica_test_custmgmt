package com.allicatest.webflux.unit;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Verifies SecurityHeadersWebFilter applies OWASP headers on every response.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@DisplayName("SecurityHeadersWebFilter (WebFlux)")
class SecurityHeadersWebFilterTest {

    @Autowired
    WebTestClient client;

    private WebTestClient withRead() {
        return client.mutateWith(SecurityMockServerConfigurers.mockJwt()
                .authorities(new SimpleGrantedAuthority("SCOPE_customers:read")));
    }

    @Test
    @DisplayName("X-Content-Type-Options: nosniff")
    void nosniff() {
        withRead()
                .get()
                .uri("/api/v1/customers")
                .exchange()
                .expectHeader()
                .valueEquals("X-Content-Type-Options", "nosniff");
    }

    @Test
    @DisplayName("X-Frame-Options: DENY")
    void frameDeny() {
        withRead().get().uri("/api/v1/customers").exchange().expectHeader().valueEquals("X-Frame-Options", "DENY");
    }

    @Test
    @DisplayName("X-XSS-Protection: 0")
    void xssProtection() {
        withRead().get().uri("/api/v1/customers").exchange().expectHeader().valueEquals("X-XSS-Protection", "0");
    }

    @Test
    @DisplayName("Referrer-Policy present")
    void referrerPolicy() {
        withRead().get().uri("/api/v1/customers").exchange().expectHeader().exists("Referrer-Policy");
    }

    @Test
    @DisplayName("Content-Security-Policy present")
    void csp() {
        withRead().get().uri("/api/v1/customers").exchange().expectHeader().exists("Content-Security-Policy");
    }

    @Test
    @DisplayName("Security headers present on 404 responses")
    void headersOnErrorResponses() {
        withRead()
                .get()
                .uri("/api/v1/customers/99999")
                .exchange()
                .expectHeader()
                .valueEquals("X-Content-Type-Options", "nosniff")
                .expectHeader()
                .valueEquals("X-Frame-Options", "DENY");
    }
}
