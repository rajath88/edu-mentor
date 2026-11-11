package com.edumentor.agent;

import dev.langchain4j.exception.HttpException;
import org.junit.jupiter.api.Test;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GroqErrorDetailsTest {

    @Test
    void findsHttpExceptionWrappedByTheAgentGraph() {
        HttpException upstream = new HttpException(429, "rate limit exceeded");
        RuntimeException wrapped = new RuntimeException("graph execution failed", upstream);

        assertSame(upstream, GroqErrorDetails.findHttpException(wrapped));
        assertEquals(429, GroqErrorDetails.findHttpException(wrapped).statusCode());
    }

    @Test
    void sanitizesCredentialsAndKeepsUsefulProviderDetails() {
        String responseBody = "{\"error\":{\"type\":\"authentication_error\","
                + "\"message\":\"Access denied\",\"key\":\"body-api-key\","
                + "\"authorization\":\"Bearer body-token\"},"
                + "\"details\":\"api_key=configured-key\"}";

        String safe = GroqErrorDetails.sanitize(responseBody, "configured-key");

        assertTrue(safe.contains("authentication_error"));
        assertTrue(safe.contains("Access denied"));
        assertFalse(safe.contains("body-api-key"));
        assertFalse(safe.contains("body-token"));
        assertFalse(safe.contains("configured-key"));
        assertTrue(safe.contains("[REDACTED]"));
    }

    @Test
    void returnsFriendlyMessagesForRateLimitQuotaAndServerFailures() {
        assertTrue(GroqErrorDetails.clientMessage(429, "rate limit exceeded").contains("rate-limited"));
        assertTrue(GroqErrorDetails.clientMessage(403, "insufficient_quota").contains("quota"));
        assertTrue(GroqErrorDetails.clientMessage(403, "billing_limit_exceeded").contains("quota"));
        assertTrue(GroqErrorDetails.clientMessage(402, "payment required").contains("quota"));
        assertTrue(GroqErrorDetails.clientMessage(408, "request timeout").contains("too long"));
        assertTrue(GroqErrorDetails.clientMessage(503, "upstream failure").contains("temporarily unavailable"));
    }

    @Test
    void detectsWrappedHttpRequestTimeoutsWithoutExposingDetails() {
        RuntimeException wrapped = new RuntimeException("request failed", new SocketTimeoutException("timed out"));

        assertTrue(GroqErrorDetails.isTimeout(wrapped));
        assertTrue(GroqErrorDetails.isTimeout(new HttpTimeoutException("request timed out")));
        assertEquals("Groq took too long to respond. Please try again.", GroqErrorDetails.timeoutClientMessage());
        assertFalse(GroqErrorDetails.isTimeout(new IllegalStateException("not a timeout")));
    }
}
