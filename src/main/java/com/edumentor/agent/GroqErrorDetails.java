package com.edumentor.agent;

import dev.langchain4j.exception.HttpException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

final class GroqErrorDetails {

    private static final int MAX_RESPONSE_LENGTH = 4_000;
    private static final Pattern JSON_CREDENTIAL_FIELD = Pattern.compile(
            "(?i)(\"(?:x-api-key|api[_-]?key|key|authorization|access[_-]?token|refresh[_-]?token|token|password|secret)\"\\s*:\\s*)\"[^\"]*\""
    );
    private static final Pattern CREDENTIAL_ASSIGNMENT = Pattern.compile(
            "(?i)(\\b(?:x-api-key|api[_-]?key|key|authorization|access[_-]?token|refresh[_-]?token|token|password|secret)\\b\\s*[:=]\\s*)[^\\s,;\"}&]+"
    );
    private static final Pattern BEARER_TOKEN = Pattern.compile(
            "(?i)(\\bBearer\\s+)[A-Za-z0-9._~+/-]+=*"
    );

    private GroqErrorDetails() {}

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

    static boolean isTimeout(Throwable failure) {
        Set<Throwable> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        for (Throwable current = failure; current != null && visited.add(current); current = current.getCause()) {
            if (current instanceof SocketTimeoutException
                    || current instanceof HttpTimeoutException
                    || current instanceof TimeoutException) {
                return true;
            }
        }
        return false;
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

    static String clientMessage(int statusCode, String providerMessage) {
        if (statusCode == 402 || isQuotaError(providerMessage)) {
            return "Groq usage quota is unavailable or exhausted. Please try again later.";
        }

        return switch (statusCode) {
            case 400 -> "Groq rejected the request. Please try rephrasing your question.";
            case 401, 403 -> "Groq authentication or access was rejected. Please contact support.";
            case 404 -> "The configured Groq model or endpoint was not found. Please contact support.";
            case 408 -> timeoutClientMessage();
            case 429 -> "Groq is rate-limited. Please wait a moment and try again.";
            case 498 -> "Groq is temporarily at capacity. Please try again shortly.";
            default -> statusCode >= 500
                    ? "Groq is temporarily unavailable. Please try again later."
                    : "AI Mentor could not complete the request. Please try again later.";
        };
    }

    static String timeoutClientMessage() {
        return "Groq took too long to respond. Please try again.";
    }

    private static boolean isQuotaError(String providerMessage) {
        if (providerMessage == null) {
            return false;
        }
        String message = providerMessage.toLowerCase(Locale.ROOT);
        return message.contains("quota")
                || message.contains("insufficient_quota")
                || message.contains("usage limit")
                || message.contains("billing limit")
                || message.contains("billing_limit")
                || message.contains("credit balance")
                || message.contains("spend limit");
    }
}
