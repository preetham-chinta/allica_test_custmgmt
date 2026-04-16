package com.allicatest.mvc.unit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.*;
import java.util.*;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import com.allicatest.mvc.customer.*;
import com.allicatest.mvc.exception.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerService")
class CustomerServiceTest {

    @Mock
    CustomerRepository repository;

    @InjectMocks
    CustomerService service;

    private static final LocalDate DOB = LocalDate.of(1990, 5, 15);

    private Customer customer(Long id) {
        return Customer.builder()
                .id(id)
                .firstName("Alice")
                .lastName("Smith")
                .dateOfBirth(DOB)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ── create ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("saves and returns V1Response on success")
    void create_success() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(false);
        when(repository.save(any())).thenReturn(customer(1L));

        var result = service.create(new CustomerDTO.CreateRequest("Alice", "Smith", DOB));

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.firstName()).isEqualTo("Alice");
        verify(repository).save(any(Customer.class));
    }

    @Test
    @DisplayName("trims whitespace from names before saving")
    void create_trimsNames() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(false);
        when(repository.save(any())).thenReturn(customer(1L));

        service.create(new CustomerDTO.CreateRequest("  Alice  ", "  Smith  ", DOB));

        verify(repository).save(argThat(c -> "Alice".equals(c.getFirstName()) && "Smith".equals(c.getLastName())));
    }

    @Test
    @DisplayName("throws CustomerAlreadyExistsException for duplicate")
    void create_duplicate_throwsConflict() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(new CustomerDTO.CreateRequest("Alice", "Smith", DOB)))
                .isInstanceOf(CustomerAlreadyExistsException.class)
                .hasMessageContaining("Alice Smith");

        verify(repository, never()).save(any());
    }

    // ── findAll ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("returns all customers in created-at desc order")
    void findAll_returnsList() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(customer(1L), customer(2L)));

        var result = service.findAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("returns empty list when no customers exist")
    void findAll_empty() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        assertThat(service.findAll()).isEmpty();
    }

    // ── findById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("returns V1Response when customer found")
    void findById_found() {
        when(repository.findById(1L)).thenReturn(Optional.of(customer(1L)));
        assertThat(service.findById(1L).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("throws CustomerNotFoundException when not found")
    void findById_notFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── findAllV2 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("V2 response includes computed fullName and status")
    void findAllV2_includesFullName() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(customer(1L)));

        var result = service.findAllV2();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).fullName()).isEqualTo("Alice Smith");
        assertThat(result.get(0).status()).isEqualTo("ACTIVE");
    }
}
