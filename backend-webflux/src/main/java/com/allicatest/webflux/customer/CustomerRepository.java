package com.allicatest.webflux.customer;

import java.time.LocalDate;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository — every method returns Mono<T> or Flux<T>.
 *
 * Compare with MVC's JpaRepository:
 *   MVC:     List<Customer> findAll()          → blocks until all rows fetched
 *   WebFlux: Flux<Customer> findAll()          → emits each row as it arrives
 *
 *   MVC:     boolean existsBy...()             → blocks
 *   WebFlux: Mono<Boolean> existsBy...()       → async, no thread blocked
 */
@Repository
public interface CustomerRepository extends R2dbcRepository<Customer, Long> {

    Mono<Boolean> existsByFirstNameAndLastNameAndDateOfBirth(String firstName, String lastName, LocalDate dateOfBirth);

    Flux<Customer> findAllByOrderByCreatedAtDesc();
}
