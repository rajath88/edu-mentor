package com.edumentor.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.edumentor.config.CorsConfig;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/** Fixed-window rate limit per client IP on the mentor endpoint, stored in Valkey. */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final StringRedisTemplate redis;
    private final int limit;
    private final CorsConfiguration corsConfiguration;

    public RateLimitFilter(StringRedisTemplate redis,
                           @Value("${mentor.rate-limit-per-minute}") int limit,
                           CorsConfig corsConfig) {
        this.redis = redis;
        this.limit = limit;
        this.corsConfiguration = corsConfig.corsConfiguration();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !"POST".equalsIgnoreCase(req.getMethod())
                || !req.getRequestURI().matches("^/api/mentor/[^/]+/ask$");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String ip = req.getHeader("X-Real-IP") != null ? req.getHeader("X-Real-IP") : req.getRemoteAddr();
        String key = "rl:" + ip + ":" + (System.currentTimeMillis() / 60_000);

        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1) {
                redis.expire(key, Duration.ofMinutes(2));
            }
            if (count != null && count > limit) {
                res.setStatus(429);
                applyAllowedCorsHeaders(req, res);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Too many requests, slow down.\"}");
                return;
            }
        } catch (DataAccessException ex) {
            // Keep the demo usable if Valkey has a brief outage; the limiter is best-effort.
            log.warn("Valkey is unavailable; continuing without the mentor rate limiter: {}", ex.getMessage());
        }

        chain.doFilter(req, res);
    }

    void applyAllowedCorsHeaders(HttpServletRequest req, HttpServletResponse res) {
        String allowedOrigin = corsConfiguration.checkOrigin(req.getHeader("Origin"));
        if (allowedOrigin == null) return;

        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        res.addHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", String.join(", ", corsConfiguration.getAllowedMethods()));
        String requestedHeaders = req.getHeader("Access-Control-Request-Headers");
        if (requestedHeaders == null || requestedHeaders.isBlank()) {
            res.setHeader("Access-Control-Allow-Headers", String.join(", ", corsConfiguration.getAllowedHeaders()));
            return;
        }

        List<String> requested = List.of(requestedHeaders.split(",")).stream()
                .map(String::trim)
                .filter(header -> !header.isEmpty())
                .toList();
        List<String> allowed = corsConfiguration.checkHeaders(requested);
        if (allowed != null) {
            res.setHeader("Access-Control-Allow-Headers", String.join(", ", requested));
        }
    }
}
