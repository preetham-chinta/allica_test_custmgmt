package com.allicatest.webflux.unit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.*;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import com.allicatest.webflux.customer.*;
import com.allicatest.webflux.exception.*;

import reactor.core.publisher.*;
import reactor.test.StepVerifier;

/**
 * Reactive service unit tests using StepVerifier.
 *
 * StepVerifier subscribes to a Mono/Flux and asserts the sequence of signals:
 *   .assertNext(item → assert on item)  — assert on emitted value
 *   .verifyComplete()                   — stream completed without error
 *   .expectError(SomeException.class).verify() — error was emitted
 *
 * Never use .block() in tests — StepVerifier is the correct way.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerService (WebFlux)")
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
    @DisplayName("emits V1Response on success")
    void create_success() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(Mono.just(false));
        when(repository.save(any())).thenReturn(Mono.just(customer(1L)));

        StepVerifier.create(service.create(new CustomerDTO.CreateRequest("Alice", "Smith", DOB)))
                .assertNext(r -> {
                    assertThat(r.id()).isEqualTo(1L);
                    assertThat(r.firstName()).isEqualTo("Alice");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("emits CustomerAlreadyExistsException for duplicate")
    void create_duplicate_emitsError() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(Mono.just(true));

        StepVerifier.create(service.create(new CustomerDTO.CreateRequest("Alice", "Smith", DOB)))
                .expectError(CustomerAlreadyExistsException.class)
                .verify();

        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("trims whitespace reactively before saving")
    void create_trimsNames() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth("Alice", "Smith", DOB))
                .thenReturn(Mono.just(false));
        when(repository.save(any())).thenReturn(Mono.just(customer(1L)));

        StepVerifier.create(service.create(new CustomerDTO.CreateRequest("  Alice  ", "  Smith  ", DOB)))
                .expectNextCount(1)
                .verifyComplete();

        verify(repository).save(argThat(c -> "Alice".equals(c.getFirstName()) && "Smith".equals(c.getLastName())));
    }

    @Test
    @DisplayName("propagates repository error through the chain")
    void create_repositoryError_propagates() {
        when(repository.existsByFirstNameAndLastNameAndDateOfBirth(any(), any(), any()))
                .thenReturn(Mono.error(new RuntimeException("DB down")));

        StepVerifier.create(service.create(new CustomerDTO.CreateRequest("Alice", "Smith", DOB)))
                .expectError(RuntimeException.class)
                .verify();
    }

    // ── findAll ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("emits all customers as a Flux stream")
    void findAll_emitsAll() {
        when(repository.findAllByOrderByCreatedAtDesc())
                .thenReturn(Flux.just(customer(1L), customer(2L), customer(3L)));

        StepVerifier.create(service.findAll()).expectNextCount(3).verifyComplete();
    }

    @Test
    @DisplayName("completes immediately with no items when empty")
    void findAll_empty_completesEmpty() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(Flux.empty());

        StepVerifier.create(service.findAll()).verifyComplete(); // no items, no error, just completion signal
    }

    @Test
    @DisplayName("maps each Customer to V1Response")
    void findAll_mapsToDTO() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(Flux.just(customer(1L)));

        StepVerifier.create(service.findAll())
                .assertNext(r -> {
                    assertThat(r).isInstanceOf(CustomerDTO.V1Response.class);
                    assertThat(r.firstName()).isEqualTo("Alice");
                })
                .verifyComplete();
    }

    // ── findById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("emits V1Response when found")
    void findById_found() {
        when(repository.findById(1L)).thenReturn(Mono.just(customer(1L)));

        StepVerifier.create(service.findById(1L))
                .assertNext(r -> assertThat(r.id()).isEqualTo(1L))
                .verifyComplete();
    }

    @Test
    @DisplayName("emits CustomerNotFoundException when not found")
    void findById_notFound_emitsError() {
        when(repository.findById(99L)).thenReturn(Mono.empty());

        StepVerifier.create(service.findById(99L))
                .expectErrorSatisfies(e -> {
                    assertThat(e).isInstanceOf(CustomerNotFoundException.class);
                    assertThat(e.getMessage()).contains("99");
                })
                .verify();
    }

    // ── findAllV2 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("V2 includes computed fullName")
    void findAllV2_fullName() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(Flux.just(customer(1L)));

        StepVerifier.create(service.findAllV2())
                .assertNext(r -> {
                    assertThat(r.fullName()).isEqualTo("Alice Smith");
                    assertThat(r.status()).isEqualTo("ACTIVE");
                })
                .verifyComplete();
    }
}
