
package com.edumentor.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

    private static final String GEMINI_OPENAI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/openai/";

    @Bean
    ChatModel chatModel(
            @Value("${llm.api-key:}") String apiKey,
            @Value("${llm.model}") String modelName,
            @Value("${llm.base-url:}") String baseUrl
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "LLM_API_KEY must be configured to enable the Gemini AI Mentor."
            );
        }

        String effectiveBaseUrl = baseUrl == null || baseUrl.isBlank()
                ? GEMINI_OPENAI_BASE_URL
                : baseUrl;

        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(effectiveBaseUrl)
                .modelName(modelName)
                .temperature(0.4)
                .timeout(Duration.ofSeconds(60))
                .build();
    }
}
