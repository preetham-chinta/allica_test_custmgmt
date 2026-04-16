package com.allicatest.webflux.handler;

import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.*;

import com.allicatest.webflux.customer.*;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * Functional handler — separates request extraction from routing.
 *
 * Why functional style instead of @RestController?
 * - More explicit: RouterFunction declares which URL → which handler
 * - Easier to unit-test: pass a MockServerRequest, assert on ServerResponse
 * - Better composability: multiple routers can share the same handler
 * - @RestController also works in WebFlux — this is a stylistic choice
 *
 * Validation note: WebFlux functional handlers don't get @Valid auto-processing
 * like @RestController does. We validate manually using the JSR-380 Validator.
 */
@Component
@RequiredArgsConstructor
public class CustomerHandler {

    private final CustomerService service;
    private final Validator validator;

    // ── V1 ───────────────────────────────────────────────────────────────────

    public Mono<ServerResponse> createV1(ServerRequest request) {
        return request.bodyToMono(CustomerDTO.CreateRequest.class).flatMap(req -> validate(req)
                .flatMap(service::create)
                .flatMap(r -> ServerResponse.status(HttpStatus.CREATED).bodyValue(r)));
    }

    public Mono<ServerResponse> findAllV1(ServerRequest request) {
        return ServerResponse.ok().body(service.findAll(), CustomerDTO.V1Response.class);
    }

    public Mono<ServerResponse> findByIdV1(ServerRequest request) {
        return service.findById(Long.parseLong(request.pathVariable("id")))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    // ── V2 ───────────────────────────────────────────────────────────────────

    public Mono<ServerResponse> createV2(ServerRequest request) {
        return request.bodyToMono(CustomerDTO.CreateRequest.class).flatMap(req -> validate(req)
                .flatMap(service::createV2)
                .flatMap(r -> ServerResponse.status(HttpStatus.CREATED).bodyValue(r)));
    }

    public Mono<ServerResponse> findAllV2(ServerRequest request) {
        return ServerResponse.ok().body(service.findAllV2(), CustomerDTO.V2Response.class);
    }

    public Mono<ServerResponse> findByIdV2(ServerRequest request) {
        return service.findByIdV2(Long.parseLong(request.pathVariable("id")))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    // ── Validation helper ────────────────────────────────────────────────────

    private <T> Mono<T> validate(T body) {
        Set<ConstraintViolation<T>> violations = validator.validate(body);
        if (violations.isEmpty()) return Mono.just(body);

        String errors = violations.stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining(", "));
        return Mono.error(new ValidationException(errors));
    }
}
