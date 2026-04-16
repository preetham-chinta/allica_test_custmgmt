package com.allicatest.webflux;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * WebFlux application config.
 *
 * Provides a JSR-380 Validator bean for CustomerHandler.
 * WebFlux functional handlers don't auto-process @Valid on @RequestBody —
 * validation must be invoked manually inside the handler.
 */
@Configuration
public class WebFluxConfig {

    @Bean
    public Validator validator() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }
}
