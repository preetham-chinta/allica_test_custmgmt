package com.allicatest.webflux.router;

import static org.springframework.web.reactive.function.server.RequestPredicates.path;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import com.allicatest.webflux.handler.CustomerHandler;

/**
 * Functional router — the WebFlux equivalent of @RequestMapping.
 * Exactly the same endpoints as the MVC module — frontend switches between
 * them via the ACTIVE_BACKEND environment variable.
 */
@Configuration
public class CustomerRouter {

    @Bean
    public RouterFunction<ServerResponse> customerRoutes(CustomerHandler handler) {
        return RouterFunctions.route()
                .nest(path("/api/v1/customers"), b -> b.POST("", handler::createV1)
                        .GET("", handler::findAllV1)
                        .GET("/{id}", handler::findByIdV1))
                .nest(path("/api/v2/customers"), b -> b.POST("", handler::createV2)
                        .GET("", handler::findAllV2)
                        .GET("/{id}", handler::findByIdV2))
                .build();
    }
}
