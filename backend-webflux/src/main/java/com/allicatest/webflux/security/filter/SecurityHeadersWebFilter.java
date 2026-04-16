package com.allicatest.webflux.security.filter;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;

import reactor.core.publisher.Mono;

/**
 * SecurityHeadersWebFilter — reactive equivalent of SecurityHeadersFilter.
 *
 * Implements WebFilter (not OncePerRequestFilter) because WebFlux uses
 * a reactive filter chain, not the servlet filter chain.
 *
 *  * Headers added:
 *
 *   X-Content-Type-Options: nosniff
 *     Prevents MIME type sniffing. Browser honours Content-Type as declared.
 *     Stops IE/Edge from executing a JS file served as text/plain.
 *
 *   X-Frame-Options: DENY
 *     Prevents clickjacking — this API response must not be framed.
 *     Superseded by CSP frame-ancestors but kept for legacy browser support.
 *
 *   X-XSS-Protection: 0
 *     Disables the old IE XSS auditor. Set to 0 because enabling it (mode=block)
 *     can introduce XSS vulnerabilities in some scenarios. CSP handles XSS instead.
 *
 *   Referrer-Policy: strict-origin-when-cross-origin
 *     Full URL sent as Referer on same-origin. Only origin (no path) cross-origin.
 *     Prevents leaking API paths or query params to third-party domains.
 *
 *   Permissions-Policy
 *     Disables browser features this API has no reason to use.
 *
 *   Content-Security-Policy
 *     Tight policy for a pure API — no scripts, no frames, no resources.
 *     Frontend (served by Nginx) has its own broader CSP.
 *
 * @Order(-2) — runs before Spring Security's WebFilter chain (@Order(-1)).
 * Headers are present on every response including auth errors.
 */
@Component
@Order(-2)
public class SecurityHeadersWebFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        HttpHeaders headers = exchange.getResponse().getHeaders();

        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "DENY");
        headers.set("X-XSS-Protection", "0");
        headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=(), usb=()");
        headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; form-action 'none'");

        return chain.filter(exchange);
    }
}
