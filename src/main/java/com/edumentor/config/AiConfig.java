package com.edumentor.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

    @Bean
    ChatModel chatModel() {

        String geminiApiKey = System.getenv("GEMINI_API_KEY");

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return OpenAiChatModel.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai/")
                    .apiKey(geminiApiKey)
                    .modelName("gemini-3.8-flash")
                    .timeout(Duration.ofSeconds(60))
                    .build();
        }

        return OllamaChatModel.builder()
                .baseUrl("http://host.docker.internal:11434")
                .modelName("llama3.2")
                .temperature(0.4)
                .timeout(Duration.ofSeconds(60))
                .build();
    }
}