package com.allicatest.mvc.unit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.*;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import com.allicatest.mvc.customer.*;
import com.allicatest.mvc.customer.v1.CustomerV1Controller;
import com.allicatest.mvc.customer.v2.CustomerV2Controller;
import com.allicatest.mvc.exception.*;
import com.allicatest.mvc.security.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = {CustomerV1Controller.class, CustomerV2Controller.class})
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@DisplayName("Customer Controllers")
class CustomerControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper mapper;

    @MockBean
    CustomerService service;

    private static final LocalDate DOB = LocalDate.of(1990, 5, 15);

    private CustomerDTO.V1Response v1(Long id) {
        return new CustomerDTO.V1Response(id, "Alice", "Smith", DOB, LocalDateTime.now());
    }

    private CustomerDTO.V2Response v2(Long id) {
        return new CustomerDTO.V2Response(
                id, "Alice", "Smith", "Alice Smith", DOB, "alice@example.com", "ACTIVE", LocalDateTime.now(), null);
    }

    private SimpleGrantedAuthority read() {
        return new SimpleGrantedAuthority("SCOPE_customers:read");
    }

    private SimpleGrantedAuthority write() {
        return new SimpleGrantedAuthority("SCOPE_customers:write");
    }

    // ── Security ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/customers → 401 without token")
    void get_401_noToken() throws Exception {
        mockMvc.perform(get("/api/v1/customers")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/customers → 403 with read-only scope")
    void post_403_readScope() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(read()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isForbidden());
    }

    // ── V1 CRUD ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/customers → 201 with write scope")
    void post_v1_201() throws Exception {
        when(service.create(any())).thenReturn(v1(1L));

        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andExpect(jsonPath("$.fullName").doesNotExist()); // not in V1
    }

    @Test
    @DisplayName("POST /api/v1/customers → 400 for blank firstName")
    void post_v1_400_blankFirstName() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("", "Smith", DOB))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("POST /api/v1/customers → 400 for future DOB")
    void post_v1_400_futureDob() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest(
                                "Alice", "Smith", LocalDate.now().plusDays(1)))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/customers → 409 for duplicate")
    void post_v1_409_duplicate() throws Exception {
        when(service.create(any())).thenThrow(new CustomerAlreadyExistsException("Alice", "Smith"));

        mockMvc.perform(post("/api/v1/customers")
                        .with(jwt().authorities(write()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new CustomerDTO.CreateRequest("Alice", "Smith", DOB))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @DisplayName("GET /api/v1/customers → 200 with list")
    void get_v1_all_200() throws Exception {
        when(service.findAll()).thenReturn(List.of(v1(1L), v1(2L)));

        mockMvc.perform(get("/api/v1/customers").with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/customers/{id} → 404 when not found")
    void get_v1_byId_404() throws Exception {
        when(service.findById(99L)).thenThrow(new CustomerNotFoundException(99L));

        mockMvc.perform(get("/api/v1/customers/99").with(jwt().authorities(read())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    // ── V2 ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v2/customers → 200 with fullName and status")
    void get_v2_all_hasFullName() throws Exception {
        when(service.findAllV2()).thenReturn(List.of(v2(1L)));

        mockMvc.perform(get("/api/v2/customers").with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Alice Smith"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v2/customers/{id} → includes email in V2 response")
    void get_v2_byId_hasEmail() throws Exception {
        when(service.findByIdV2(1L)).thenReturn(v2(1L));

        mockMvc.perform(get("/api/v2/customers/1").with(jwt().authorities(read())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }
}
