package com.allicatest.webflux.versioning;

import java.util.List;
import java.util.regex.*;

import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.server.*;

import reactor.core.publisher.Mono;

/**
 * Reactive API versioning filter — WebFilter (not OncePerRequestFilter).
 *
 * Same three resolution strategies as MVC:
 *   1. URI path:    /api/v1/customers
 *   2. Header:      X-API-Version: v2
 *   3. Accept MIME: Accept: application/vnd.allicatest.v2+json
 *   4. Default:     v1
 */
@Order(-1)
@Component
public class ReactiveApiVersioningFilter implements WebFilter {

    private static final List<String> SUPPORTED = List.of("v1", "v2");
    private static final Pattern URI_PATTERN = Pattern.compile("^/api/(v\\d+)/.*");
    private static final Pattern MIME_PATTERN = Pattern.compile("application/vnd\\.allicatest\\.(v\\d+)\\+json");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (!path.startsWith("/api/")) return chain.filter(exchange);

        String version = resolveVersion(exchange);

        if (version != null && !SUPPORTED.contains(version)) {
            exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            byte[] body = ("{\"status\":400,\"error\":\"Unsupported version: " + version + "\"}").getBytes();
            DataBuffer buf = exchange.getResponse().bufferFactory().wrap(body);
            return exchange.getResponse().writeWith(Mono.just(buf));
        }

        String resolved = version != null ? version : "v1";
        exchange.getResponse().getHeaders().add("X-API-Version", resolved);
        exchange.getResponse().getHeaders().add("X-API-Supported-Versions", String.join(", ", SUPPORTED));

        return chain.filter(exchange);
    }

    private String resolveVersion(ServerWebExchange exchange) {
        Matcher m = URI_PATTERN.matcher(exchange.getRequest().getPath().value());
        if (m.matches()) return m.group(1);

        String header = exchange.getRequest().getHeaders().getFirst("X-API-Version");
        if (header != null && !header.isBlank()) return header.trim();

        String accept = exchange.getRequest().getHeaders().getFirst("Accept");
        if (accept != null) {
            Matcher am = MIME_PATTERN.matcher(accept);
            if (am.find()) return am.group(1);
        }
        return null;
    }
}
