package com.edumentor.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class CorsConfigTest {

    private static final String ORIGINS = String.join(",",
            "http://localhost",
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:4174",
            "http://localhost:4175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4174",
            "http://127.0.0.1:4175",
            "https://*.vercel.app"
    );

    @Test
    void allowsConfiguredDevelopmentAndEduMentorDeploymentOrigins() {
        CorsConfiguration cors = new CorsConfig(ORIGINS).corsConfiguration();

        for (String origin : List.of(
                "http://localhost:5173",
                "http://localhost:4173",
                "http://localhost:4174",
                "http://localhost:4175",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:4174",
                "http://127.0.0.1:4175",
                "https://edu-mentor-two.vercel.app"
        )) {
            assertEquals(origin, cors.checkOrigin(origin));
        }

        assertNull(cors.checkOrigin("https://untrusted.example"));
    }

    @Test
    void allowsRequiredMethodsAndHeadersForPreflight() {
        CorsConfiguration cors = new CorsConfig(ORIGINS).corsConfiguration();

        for (HttpMethod method : List.of(
                HttpMethod.GET,
                HttpMethod.POST,
                HttpMethod.PUT,
                HttpMethod.DELETE,
                HttpMethod.OPTIONS
        )) {
            assertNotNull(cors.checkHttpMethod(method));
        }

        assertNotNull(cors.checkHeaders(List.of("content-type", "authorization")));
        assertNull(cors.checkHeaders(List.of("x-unapproved-header")));
    }
}
