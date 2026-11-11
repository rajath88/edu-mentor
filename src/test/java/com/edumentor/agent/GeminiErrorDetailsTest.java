package com.edumentor.agent;

import dev.langchain4j.exception.HttpException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeminiErrorDetailsTest {

    @Test
    void findsHttpExceptionWrappedByTheAgentGraph() {
        HttpException upstream = new HttpException(429, "quota exceeded");
        RuntimeException wrapped = new RuntimeException("graph execution failed", upstream);

        assertSame(upstream, GeminiErrorDetails.findHttpException(wrapped));
        assertEquals(429, GeminiErrorDetails.findHttpException(wrapped).statusCode());
    }

    @Test
    void sanitizesCredentialsAndKeepsUsefulProviderDetails() {
        String responseBody = "{\"error\":{\"status\":\"PERMISSION_DENIED\","
                + "\"message\":\"Access denied\",\"key\":\"body-api-key\","
                + "\"authorization\":\"Bearer body-token\"},"
                + "\"details\":\"x-goog-api-key=configured-key\"}";

        String safe = GeminiErrorDetails.sanitize(responseBody, "configured-key");

        assertTrue(safe.contains("PERMISSION_DENIED"));
        assertTrue(safe.contains("Access denied"));
        assertFalse(safe.contains("body-api-key"));
        assertFalse(safe.contains("body-token"));
        assertFalse(safe.contains("configured-key"));
        assertTrue(safe.contains("[REDACTED]"));
    }

    @Test
    void mapsCommonGeminiHttpFailuresToSafeFrontendMessages() {
        assertTrue(GeminiErrorDetails.clientMessage(403).contains("contact support"));
        assertTrue(GeminiErrorDetails.clientMessage(404).contains("model or endpoint"));
        assertTrue(GeminiErrorDetails.clientMessage(429).contains("quota"));
        assertTrue(GeminiErrorDetails.clientMessage(503).contains("temporarily unavailable"));
    }
}
