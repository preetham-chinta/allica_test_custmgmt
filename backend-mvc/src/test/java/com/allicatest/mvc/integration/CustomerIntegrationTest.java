package com.allicatest.mvc.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.allicatest.mvc.customer.*;
import com.allicatest.mvc.customer.search.*;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Full integration tests.
 * Real H2 database + real Flyway migrations + real Spring context.
 * Only the JWT token is mocked — everything else is the real stack.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Customer Integration Tests")
class CustomerIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper mapper;

    @Autowired
    CustomerRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    private SimpleGrantedAuthority read() {
        return new SimpleGrantedAuthority("SCOPE_customers:read");
    }

    private SimpleGrantedAuthority write() {
        return new SimpleGrantedAuthority("SCOPE_customers:write");
    }

    private static final LocalDate DOB = LocalDate.of(1990, 5, 15);

    // ── Full CRUD flow ───────────────────────────────────────────────────────

    @Test
    @DisplayName("create → getById → getAll full journey")
    void fullCrudFlow() throws Exception {
        // Create
        var result = mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andReturn();

        var created = mapper.readValue(result.getResponse().getContentAsString(), CustomerDTO.V1Response.class);

        // Get by ID
        mockMvc.perform(get("/api/v1/customers/{id}", created.id()).with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dateOfBirth").value(DOB.toString()));

        // Get all
        mockMvc.perform(get("/api/v1/customers").with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        assertThat(repository.count()).isEqualTo(1);
    }

    // ── Duplicate prevention ─────────────────────────────────────────────────

    @Test
    @DisplayName("same name + DOB → 409")
    void duplicate_returns409() throws Exception {
        String body = mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB));

        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("same name different DOB → allowed")
    void sameName_differentDob_allowed() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new CustomerDTO.CreateRequest("Alice", "Smith", LocalDate.of(1985, 1, 1)))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new CustomerDTO.CreateRequest("Alice", "Smith", LocalDate.of(1990, 6, 15)))))
                .andExpect(status().isCreated());

        assertThat(repository.count()).isEqualTo(2);
    }

    // ── V1 vs V2 response shape ──────────────────────────────────────────────

    @Test
    @DisplayName("V1 response does NOT contain fullName")
    void v1_noFullName() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/customers").with(jwt().authorities(read())))
                .andExpect(jsonPath("$[0].fullName").doesNotExist());
    }

    @Test
    @DisplayName("V2 response DOES contain fullName and status")
    void v2_hasFullNameAndStatus() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v2/customers").with(jwt().authorities(read())))
                .andExpect(jsonPath("$[0].fullName").value("Alice Smith"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    // ── API Versioning headers ───────────────────────────────────────────────

    @Test
    @DisplayName("response always includes X-API-Version header")
    void response_hasVersionHeader() throws Exception {
        mockMvc.perform(get("/api/v1/customers").with(jwt().authorities(read())))
                .andExpect(header().string("X-API-Version", "v1"));
    }

    @Test
    @DisplayName("X-API-Supported-Versions is present on all responses")
    void response_hasSupportedVersionsHeader() throws Exception {
        mockMvc.perform(get("/api/v2/customers").with(jwt().authorities(read())))
                .andExpect(header().exists("X-API-Supported-Versions"));
    }

    // ── Validation ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("blank firstName → 400 with field error")
    void validation_blankFirstName() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("", "Smith", DOB))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("future DOB → 400")
    void validation_futureDob() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest(
                                "Alice", "Smith", LocalDate.now().plusDays(1)))))
                .andExpect(status().isBadRequest());
    }

    // ── 404 ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/customers/9999 → 404")
    void notFound_404() throws Exception {
        mockMvc.perform(get("/api/v1/customers/9999").with(jwt().authorities(read())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("9999")));
    }

    // ── Search integration ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/customers/search → returns matching customers")
    void search_v1_returnsResults() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/customers/search").param("query", "Alice").with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHits").value(1))
                .andExpect(jsonPath("$.results[0].firstName").value("Alice"));
    }
}
