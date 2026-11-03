package com.edumentor.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/** Fixed-window rate limit per client IP on the (costly) mentor endpoint, stored in Valkey. */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redis;
    private final int limit;

    public RateLimitFilter(StringRedisTemplate redis, @Value("${mentor.rate-limit-per-minute}") int limit) {
        this.redis = redis; this.limit = limit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !req.getRequestURI().startsWith("/api/mentor");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String ip = req.getHeader("X-Real-IP") != null ? req.getHeader("X-Real-IP") : req.getRemoteAddr();
        String key = "rl:" + ip + ":" + (System.currentTimeMillis() / 60_000);
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) redis.expire(key, Duration.ofMinutes(2));
        if (count != null && count > limit) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests, slow down.\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
