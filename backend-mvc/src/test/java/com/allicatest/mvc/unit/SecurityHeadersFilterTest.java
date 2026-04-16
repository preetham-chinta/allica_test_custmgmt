package com.allicatest.mvc.unit;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies that SecurityHeadersFilter applies OWASP headers on every response.
 * Tests run against the full Spring context with the test profile.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("SecurityHeadersFilter (MVC)")
class SecurityHeadersFilterTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("X-Content-Type-Options: nosniff on all responses")
    void nosniff() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("X-Frame-Options: DENY on all responses")
    void frameDeny() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    @DisplayName("X-XSS-Protection: 0 on all responses")
    void xssProtection() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().string("X-XSS-Protection", "0"));
    }

    @Test
    @DisplayName("Referrer-Policy present on all responses")
    void referrerPolicy() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().exists("Referrer-Policy"));
    }

    @Test
    @DisplayName("Content-Security-Policy present on all responses")
    void csp() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().exists("Content-Security-Policy"));
    }

    @Test
    @DisplayName("Permissions-Policy present on all responses")
    void permissionsPolicy() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().exists("Permissions-Policy"));
    }

    @Test
    @DisplayName("Security headers present on error responses too")
    void headersOnErrorResponses() throws Exception {
        // 404 — headers must be present even on error responses
        mockMvc.perform(get("/api/v1/customers/99999")
                        .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_customers:read"))))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }
}
