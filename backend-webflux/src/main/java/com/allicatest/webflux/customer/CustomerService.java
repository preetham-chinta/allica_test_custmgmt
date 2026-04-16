package com.allicatest.webflux.customer;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.allicatest.webflux.exception.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive service — every method returns Mono<T> or Flux<T>.
 *
 * Reactive chain anatomy:
 *
 *   create():
 *     existsBy...()           → Mono<Boolean>
 *       .flatMap(exists → …)  → if exists: error; else: save
 *         .map(V1Response::from) → transform entity to DTO
 *
 *   findById():
 *     findById(id)            → Mono<Customer>  (empty if not found)
 *       .map(V1Response::from)
 *       .switchIfEmpty(Mono.error(…))  → converts empty to CustomerNotFoundException
 *
 * Rule: NEVER call .block() in a reactive service.
 * That defeats non-blocking I/O and can cause deadlocks under load.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;

    @PreAuthorize("hasAuthority('SCOPE_customers:write')")
    public Mono<CustomerDTO.V1Response> create(CustomerDTO.CreateRequest request) {
        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();

        return repository
                .existsByFirstNameAndLastNameAndDateOfBirth(firstName, lastName, request.dateOfBirth())
                .flatMap(exists -> exists
                        ? Mono.error(new CustomerAlreadyExistsException(firstName, lastName))
                        : repository.save(Customer.builder()
                                .firstName(firstName)
                                .lastName(lastName)
                                .dateOfBirth(request.dateOfBirth())
                                .build()))
                .map(CustomerDTO.V1Response::from)
                .doOnSuccess(c -> log.info("Customer created id={}", c.id()));
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public Flux<CustomerDTO.V1Response> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().map(CustomerDTO.V1Response::from);
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public Mono<CustomerDTO.V1Response> findById(Long id) {
        return repository
                .findById(id)
                .map(CustomerDTO.V1Response::from)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(id)));
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public Flux<CustomerDTO.V2Response> findAllV2() {
        return repository.findAllByOrderByCreatedAtDesc().map(CustomerDTO.V2Response::from);
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:read')")
    public Mono<CustomerDTO.V2Response> findByIdV2(Long id) {
        return repository
                .findById(id)
                .map(CustomerDTO.V2Response::from)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(id)));
    }

    @PreAuthorize("hasAuthority('SCOPE_customers:write')")
    public Mono<CustomerDTO.V2Response> createV2(CustomerDTO.CreateRequest request) {
        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();

        return repository
                .existsByFirstNameAndLastNameAndDateOfBirth(firstName, lastName, request.dateOfBirth())
                .flatMap(exists -> exists
                        ? Mono.error(new CustomerAlreadyExistsException(firstName, lastName))
                        : repository.save(Customer.builder()
                                .firstName(firstName)
                                .lastName(lastName)
                                .dateOfBirth(request.dateOfBirth())
                                .build()))
                .map(CustomerDTO.V2Response::from);
    }
}
