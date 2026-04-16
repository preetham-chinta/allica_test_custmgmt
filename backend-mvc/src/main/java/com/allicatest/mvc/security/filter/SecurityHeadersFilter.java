package com.allicatest.mvc.security.filter;

import java.io.IOException;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * SecurityHeadersFilter — adds OWASP-recommended HTTP security headers.
 *
 * Addresses OWASP Top 10 A05:2021 — Security Misconfiguration.
 * Runs at Order(1) — before Spring Security — so headers are always present.
 *
 * Headers added:
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
 * Note: HSTS (Strict-Transport-Security) is intentionally omitted here.
 * HSTS is only meaningful over HTTPS and should be added at the load balancer
 * or API gateway layer in production (Nginx, AWS ALB, GCP Cloud Armor).
 */
@Component
@Order(1)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Prevent MIME sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");

        // Disable legacy XSS auditor (see above for reasoning)
        response.setHeader("X-XSS-Protection", "0");

        // Control Referer header on cross-origin requests
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Disable browser features not needed by this API
        response.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=(), usb=()");

        // Tight CSP for a REST API — no scripts, styles, or frames needed
        response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; form-action 'none'");

        chain.doFilter(request, response);
    }
}
