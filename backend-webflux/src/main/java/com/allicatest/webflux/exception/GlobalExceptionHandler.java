package com.allicatest.webflux.exception;

import jakarta.validation.ValidationException;

import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;

import com.allicatest.webflux.customer.CustomerDTO.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Reactive global exception handler.
 *
 * WebFlux equivalent of @ControllerAdvice.
 * @Order(-2) — must run before Spring's default exception handler (@Order(-1)).
 *
 * Key difference from MVC:
 * - Returns Mono<Void> not ResponseEntity
 * - Writes directly to the response buffer
 * - Errors arrive via the reactive pipeline, not a try/catch
 */
@Slf4j
@Order(-2)
@Component
@RequiredArgsConstructor
public class GlobalExceptionHandler implements WebExceptionHandler {

    private final ObjectMapper mapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        HttpStatus status;
        String error, message;

        if (ex instanceof CustomerNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "Not Found";
            message = ex.getMessage();
        } else if (ex instanceof CustomerAlreadyExistsException) {
            status = HttpStatus.CONFLICT;
            error = "Conflict";
            message = ex.getMessage();
        } else if (ex instanceof ValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "Validation Failed";
            message = ex.getMessage();
        } else if (ex instanceof AccessDeniedException) {
            status = HttpStatus.FORBIDDEN;
            error = "Forbidden";
            message = "Insufficient scope";
        } else {
            log.error("Unhandled reactive exception", ex);
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            error = "Internal Server Error";
            message = "An unexpected error occurred";
        }

        return write(exchange, new ErrorResponse(status.value(), error, message));
    }

    private Mono<Void> write(ServerWebExchange exchange, ErrorResponse body) {
        exchange.getResponse().setStatusCode(HttpStatus.valueOf(body.status()));
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        try {
            byte[] bytes = mapper.writeValueAsBytes(body);
            DataBuffer buf = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buf));
        } catch (Exception e) {
            return Mono.error(e);
        }
    }
}
