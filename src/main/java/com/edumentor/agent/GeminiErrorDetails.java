package com.edumentor.agent;

import dev.langchain4j.exception.HttpException;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;
import java.util.regex.Pattern;

final class GeminiErrorDetails {

    private static final int MAX_RESPONSE_LENGTH = 4_000;
    private static final Pattern JSON_CREDENTIAL_FIELD = Pattern.compile(
            "(?i)(\"(?:x-goog-api-key|api[_-]?key|key|authorization|access[_-]?token|refresh[_-]?token|token|password|secret)\"\\s*:\\s*)\"[^\"]*\""
    );
    private static final Pattern CREDENTIAL_ASSIGNMENT = Pattern.compile(
            "(?i)(\\b(?:x-goog-api-key|api[_-]?key|key|authorization|access[_-]?token|refresh[_-]?token|token|password|secret)\\b\\s*[:=]\\s*)[^\\s,;\"}&]+"
    );
    private static final Pattern BEARER_TOKEN = Pattern.compile(
            "(?i)(\\bBearer\\s+)[A-Za-z0-9._~+/-]+=*"
    );

    private GeminiErrorDetails() {}

    static HttpException findHttpException(Throwable failure) {
        Set<Throwable> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        for (Throwable current = failure; current != null && visited.add(current); current = current.getCause()) {
            if (current instanceof HttpException httpException) {
                return httpException;
            }
        }
        return null;
    }

    static Throwable rootCause(Throwable failure) {
        Set<Throwable> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        Throwable current = failure;
        while (current != null && current.getCause() != null && visited.add(current.getCause())) {
            current = current.getCause();
        }
        return current == null ? failure : current;
    }

    static String sanitize(String text, String apiKey) {
        if (text == null || text.isBlank()) {
            return "No response body";
        }

        String safe = text;
        if (apiKey != null && !apiKey.isBlank()) {
            safe = safe.replace(apiKey, "[REDACTED]");
        }
        safe = JSON_CREDENTIAL_FIELD.matcher(safe).replaceAll("$1\"[REDACTED]\"");
        safe = CREDENTIAL_ASSIGNMENT.matcher(safe).replaceAll("$1[REDACTED]");
        safe = BEARER_TOKEN.matcher(safe).replaceAll("$1[REDACTED]");
        safe = safe.replaceAll("[\\r\\n\\t]+", " ").trim();
        if (safe.length() > MAX_RESPONSE_LENGTH) {
            safe = safe.substring(0, MAX_RESPONSE_LENGTH) + "…[truncated]";
        }
        return safe;
    }

    static String clientMessage(int statusCode) {
        return switch (statusCode) {
            case 400 -> "Gemini rejected the request. Try rephrasing your question.";
            case 401, 403 -> "Gemini authentication or access was rejected. Please contact support.";
            case 404 -> "The configured Gemini model or endpoint was not found. Please contact support.";
            case 429 -> "Gemini is rate-limited or its quota is exhausted. Please try again later.";
            default -> statusCode >= 500
                    ? "Gemini is temporarily unavailable. Please try again later."
                    : "AI Mentor could not complete the request. Please try again later.";
        };
    }
}
