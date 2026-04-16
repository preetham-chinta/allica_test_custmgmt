package com.allicatest.mvc.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${security.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    /**
     * Production security — JWT RS256 resource server.
     *
     * Auth flow:
     *   Client → POST /oauth2/token (auth server) → JWT
     *   Client → GET  /api/v1/customers           → presents JWT in Authorization: Bearer header
     *   Spring validates signature against JWK Set URI, checks scope claim.
     */
    @Bean
    @Profile("!dev")
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers("/actuator/health")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/**")
                        .hasAuthority("SCOPE_customers:read")
                        .requestMatchers(HttpMethod.POST, "/api/**")
                        .hasAuthority("SCOPE_customers:write")
                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter())))
                .build();
    }

    /**
     * Dev / demo security — all API endpoints open.
     *
     * This lets the interviewer call the API directly without needing an auth server.
     * The JWT configuration above still demonstrates how production security works.
     * See README for how to run with production security enabled.
     */
    @Bean
    @Profile("dev")
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(
                        new DevAuthFilter(),
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    private static class DevAuthFilter extends org.springframework.web.filter.OncePerRequestFilter {
        @Override
        protected void doFilterInternal(
                jakarta.servlet.http.HttpServletRequest request,
                jakarta.servlet.http.HttpServletResponse response,
                jakarta.servlet.FilterChain filterChain)
                throws jakarta.servlet.ServletException, java.io.IOException {
            if (org.springframework.security.core.context.SecurityContextHolder.getContext()
                            .getAuthentication()
                    == null) {
                var authorities = org.springframework.security.core.authority.AuthorityUtils.createAuthorityList(
                        "SCOPE_customers:read", "SCOPE_customers:write");
                var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "dev-user", null, authorities);
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .setAuthentication(auth);
            }
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Converts JWT 'scope' claim → Spring Security GrantedAuthority.
     * e.g.  scope: "customers:read customers:write"
     *       → SCOPE_customers:read, SCOPE_customers:write
     */
    @Bean
    public JwtAuthenticationConverter jwtConverter() {
        JwtGrantedAuthoritiesConverter authConverter = new JwtGrantedAuthoritiesConverter();
        authConverter.setAuthoritiesClaimName("scope");
        authConverter.setAuthorityPrefix("SCOPE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authConverter);
        return converter;
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
