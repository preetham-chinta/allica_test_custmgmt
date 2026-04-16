package com.allicatest.mvc.versioning;

import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;

/**
 * API version resolution — priority order:
 *   1. URI path:    /api/v1/customers
 *   2. Header:      X-API-Version: v2
 *   3. Accept MIME: Accept: application/vnd.allicatest.v2+json
 *   4. Default:     v1
 *
 * Every response gets:
 *   X-API-Version: v1
 *   X-API-Supported-Versions: v1, v2
 */
@Slf4j
@Component
public class ApiVersioningFilter extends OncePerRequestFilter {

    private static final List<String> SUPPORTED = List.of("v1", "v2");
    private static final Pattern URI_PATTERN = Pattern.compile("^/api/(v\\d+)/.*");
    private static final Pattern ACCEPT_PATTERN = Pattern.compile("application/vnd\\.allicatest\\.(v\\d+)\\+json");

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (!req.getRequestURI().startsWith("/api/")) {
            chain.doFilter(req, res);
            return;
        }

        String version = resolveVersion(req);

        if (version != null && !SUPPORTED.contains(version)) {
            res.setStatus(HttpStatus.BAD_REQUEST.value());
            res.setContentType("application/json");
            res.getWriter().write("{\"status\":400,\"error\":\"Unsupported API version: " + version + "\"}");
            return;
        }

        String resolved = (version != null) ? version : "v1";
        res.addHeader("X-API-Version", resolved);
        res.addHeader("X-API-Supported-Versions", String.join(", ", SUPPORTED));
        chain.doFilter(req, res);
    }

    private String resolveVersion(HttpServletRequest req) {
        // Strategy 1 — URI path
        Matcher m = URI_PATTERN.matcher(req.getRequestURI());
        if (m.matches()) return m.group(1);

        // Strategy 2 — custom header
        String header = req.getHeader("X-API-Version");
        if (header != null && !header.isBlank()) return header.trim();

        // Strategy 3 — Accept vendor MIME type
        String accept = req.getHeader("Accept");
        if (accept != null) {
            Matcher am = ACCEPT_PATTERN.matcher(accept);
            if (am.find()) return am.group(1);
        }

        return null; // fall through to default v1
    }
}
