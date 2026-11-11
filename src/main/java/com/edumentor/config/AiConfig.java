
package com.edumentor.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

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

        var builder = GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(0.4)
                .timeout(Duration.ofSeconds(60));

        if (baseUrl != null && !baseUrl.isBlank()) {
            builder.baseUrl(baseUrl);
        }

        return builder.build();
    }
}
