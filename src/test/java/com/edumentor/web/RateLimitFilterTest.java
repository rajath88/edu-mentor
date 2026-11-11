package com.edumentor.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitFilterTest {

    private final RateLimitFilter filter = new RateLimitFilter(
            null, 10, "http://localhost:5173,https://*.vercel.app");

    @Test
    void rateLimitsOnlyMentorAskPostRequests() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/mentor/12/history");
        assertTrue(filter.shouldNotFilter(request));

        request = new MockHttpServletRequest("POST", "/api/mentor/12/history");
        assertTrue(filter.shouldNotFilter(request));

        request = new MockHttpServletRequest("POST", "/api/students");
        assertTrue(filter.shouldNotFilter(request));

        request = new MockHttpServletRequest("POST", "/api/mentor/12/ask");
        assertFalse(filter.shouldNotFilter(request));
    }

    @Test
    void rateLimitResponseCarriesCorsHeadersOnlyForConfiguredOrigins() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/mentor/12/ask");
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader("Origin", "https://edu-mentor-two.vercel.app");
        request.addHeader("Access-Control-Request-Headers", "content-type");

        filter.applyAllowedCorsHeaders(request, response);

        assertEquals("https://edu-mentor-two.vercel.app", response.getHeader("Access-Control-Allow-Origin"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("POST"));
        assertEquals("content-type", response.getHeader("Access-Control-Allow-Headers"));

        MockHttpServletRequest untrusted = new MockHttpServletRequest("POST", "/api/mentor/12/ask");
        MockHttpServletResponse rejected = new MockHttpServletResponse();
        untrusted.addHeader("Origin", "https://not-allowed.example");
        filter.applyAllowedCorsHeaders(untrusted, rejected);
        assertTrue(rejected.getHeader("Access-Control-Allow-Origin") == null);
    }
}
