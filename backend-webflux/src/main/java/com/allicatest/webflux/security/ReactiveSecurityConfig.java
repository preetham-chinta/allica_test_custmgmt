package com.allicatest.webflux.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class ReactiveSecurityConfig {

    @Value("${security.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    /**
     * Production — full JWT RS256.
     * Uses ServerHttpSecurity (reactive) not HttpSecurity (blocking).
     * JWT converter must be ReactiveJwtAuthenticationConverterAdapter.
     */
    @Bean
    @Profile("!dev")
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsSource()))
                .authorizeExchange(auth -> auth.pathMatchers("/actuator/health")
                        .permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/**")
                        .hasAuthority("SCOPE_customers:read")
                        .pathMatchers(HttpMethod.POST, "/api/**")
                        .hasAuthority("SCOPE_customers:write")
                        .anyExchange()
                        .authenticated())
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(reactiveJwtConverter())))
                .build();
    }

    /** Dev / demo — all endpoints open. Same reasoning as MVC SecurityConfig. */
    @Bean
    @Profile("dev")
    public SecurityWebFilterChain devSecurityWebFilterChain(ServerHttpSecurity http) {
        return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsSource()))
                .authorizeExchange(auth -> auth.anyExchange().permitAll())
                .addFilterAt(
                        new DevAuthWebFilter(),
                        org.springframework.security.config.web.server.SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    private static class DevAuthWebFilter implements org.springframework.web.server.WebFilter {
        @Override
        public reactor.core.publisher.Mono<Void> filter(
                org.springframework.web.server.ServerWebExchange exchange,
                org.springframework.web.server.WebFilterChain chain) {
            return org.springframework.security.core.context.ReactiveSecurityContextHolder.getContext()
                    .filter(c -> c.getAuthentication() != null)
                    .flatMap(c -> chain.filter(exchange))
                    .switchIfEmpty(
                            reactor.core.publisher.Mono.defer(
                                    () -> {
                                        var authorities = org.springframework.security.core.authority.AuthorityUtils
                                                .createAuthorityList("SCOPE_customers:read", "SCOPE_customers:write");
                                        var auth = new org.springframework.security.authentication
                                                .UsernamePasswordAuthenticationToken("dev-user", null, authorities);
                                        return chain.filter(exchange)
                                                .contextWrite(org.springframework.security.core.context
                                                        .ReactiveSecurityContextHolder.withAuthentication(auth));
                                    }));
        }
    }

    /**
     * Wraps the blocking JwtAuthenticationConverter in a reactive adapter.
     * Required because WebFlux uses a reactive authentication pipeline.
     */
    @Bean
    public ReactiveJwtAuthenticationConverterAdapter reactiveJwtConverter() {
        JwtGrantedAuthoritiesConverter authConverter = new JwtGrantedAuthoritiesConverter();
        authConverter.setAuthoritiesClaimName("scope");
        authConverter.setAuthorityPrefix("SCOPE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authConverter);
        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-API-Version"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
